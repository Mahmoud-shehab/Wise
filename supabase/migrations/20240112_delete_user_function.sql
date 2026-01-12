-- Create a function to delete a user and all related data
-- This function runs with SECURITY DEFINER to bypass RLS policies
CREATE OR REPLACE FUNCTION delete_user_cascade(user_id_to_delete UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  table_exists BOOLEAN;
BEGIN
  -- Delete task_activity records (if table exists)
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'task_activity'
  ) INTO table_exists;
  IF table_exists THEN
    DELETE FROM task_activity WHERE actor_id = user_id_to_delete;
  END IF;
  
  -- Unassign tasks
  UPDATE tasks SET assignee_id = NULL WHERE assignee_id = user_id_to_delete;
  UPDATE tasks SET created_by = NULL WHERE created_by = user_id_to_delete;
  
  -- Update tasks reviewer to null (if column exists)
  BEGIN
    UPDATE tasks SET reviewer_id = NULL WHERE reviewer_id = user_id_to_delete;
  EXCEPTION
    WHEN undefined_column THEN NULL;
  END;
  
  -- Delete comments (if table exists)
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'task_comments'
  ) INTO table_exists;
  IF table_exists THEN
    DELETE FROM task_comments WHERE user_id = user_id_to_delete;
  END IF;
  
  -- Delete notifications (if table exists)
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) INTO table_exists;
  IF table_exists THEN
    DELETE FROM notifications WHERE user_id = user_id_to_delete;
  END IF;
  
  -- Delete task reviewers (if table exists)
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'task_reviewers'
  ) INTO table_exists;
  IF table_exists THEN
    DELETE FROM task_reviewers WHERE reviewer_id = user_id_to_delete;
  END IF;
  
  -- Delete project members (if table exists)
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'project_members'
  ) INTO table_exists;
  IF table_exists THEN
    DELETE FROM project_members WHERE user_id = user_id_to_delete;
  END IF;
  
  -- Update projects owner (if table exists)
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'projects'
  ) INTO table_exists;
  IF table_exists THEN
    BEGIN
      UPDATE projects SET owner_id = NULL WHERE owner_id = user_id_to_delete;
    EXCEPTION
      WHEN undefined_column THEN NULL;
    END;
  END IF;
  
  -- Delete messages (if table exists)
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'messages'
  ) INTO table_exists;
  IF table_exists THEN
    DELETE FROM messages WHERE sender_id = user_id_to_delete OR receiver_id = user_id_to_delete;
  END IF;
  
  -- Finally delete the profile
  DELETE FROM profiles WHERE id = user_id_to_delete;
  
  -- Return success
  result := json_build_object(
    'success', true,
    'message', 'User deleted successfully'
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return error
    result := json_build_object(
      'success', false,
      'message', SQLERRM
    );
    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_cascade(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION delete_user_cascade IS 'Deletes a user and all related data, bypassing RLS policies. Checks for table existence before operations.';
