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
BEGIN
  -- Delete task_activity records
  DELETE FROM task_activity WHERE actor_id = user_id_to_delete;
  
  -- Unassign tasks
  UPDATE tasks SET assignee_id = NULL WHERE assignee_id = user_id_to_delete;
  UPDATE tasks SET created_by = NULL WHERE created_by = user_id_to_delete;
  UPDATE tasks SET reviewer_id = NULL WHERE reviewer_id = user_id_to_delete;
  
  -- Delete comments
  DELETE FROM task_comments WHERE user_id = user_id_to_delete;
  
  -- Delete notifications
  DELETE FROM notifications WHERE user_id = user_id_to_delete;
  
  -- Delete task reviewers
  DELETE FROM task_reviewers WHERE reviewer_id = user_id_to_delete;
  
  -- Delete project members
  DELETE FROM project_members WHERE user_id = user_id_to_delete;
  
  -- Update projects owner
  UPDATE projects SET owner_id = NULL WHERE owner_id = user_id_to_delete;
  
  -- Delete messages (if exists)
  DELETE FROM messages WHERE sender_id = user_id_to_delete;
  DELETE FROM messages WHERE receiver_id = user_id_to_delete;
  
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
COMMENT ON FUNCTION delete_user_cascade IS 'Deletes a user and all related data, bypassing RLS policies';
