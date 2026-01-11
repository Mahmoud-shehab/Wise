-- ============================================
-- Asana-like Features Migration
-- ============================================

-- 1. Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('active', 'archived', 'on_hold')) DEFAULT 'active',
  color TEXT DEFAULT '#3b82f6',
  icon TEXT,
  start_date DATE,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create project_members table
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('owner', 'member', 'viewer')) DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- 3. Create sections table (for organizing tasks within projects)
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add new columns to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES sections(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(10,2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(10,2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- 5. Create task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create task_attachments table
CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create task_dependencies table
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  depends_on_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  dependency_type TEXT CHECK (dependency_type IN ('blocks', 'blocked_by', 'related')) DEFAULT 'blocks',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, depends_on_task_id)
);

-- 9. Create custom_fields table
CREATE TABLE IF NOT EXISTS custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  field_type TEXT CHECK (field_type IN ('text', 'number', 'date', 'select', 'multi_select', 'checkbox')) NOT NULL,
  options JSONB,
  required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Create custom_field_values table
CREATE TABLE IF NOT EXISTS custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  field_id UUID REFERENCES custom_fields(id) ON DELETE CASCADE NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, field_id)
);

-- 11. Create project_templates table
CREATE TABLE IF NOT EXISTS project_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#gray',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Create task_tags table (many-to-many)
CREATE TABLE IF NOT EXISTS task_tags (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (task_id, tag_id)
);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_company ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);

CREATE INDEX IF NOT EXISTS idx_sections_project ON sections(project_id);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_section ON tasks(section_id);

CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user ON task_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON task_attachments(task_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_task ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends ON task_dependencies(depends_on_task_id);

CREATE INDEX IF NOT EXISTS idx_custom_fields_project ON custom_fields(project_id);

CREATE INDEX IF NOT EXISTS idx_custom_field_values_task ON custom_field_values(task_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_field ON custom_field_values(field_id);

CREATE INDEX IF NOT EXISTS idx_task_tags_task ON task_tags(task_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_tag ON task_tags(tag_id);

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;

-- Projects Policies
CREATE POLICY "Users can view projects they are members of"
  ON projects FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM project_members WHERE project_id = projects.id
    )
    OR owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'manager'
    )
  );

CREATE POLICY "Managers can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'manager'
    )
  );

CREATE POLICY "Project owners and managers can update projects"
  ON projects FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'manager'
    )
  );

CREATE POLICY "Project owners and managers can delete projects"
  ON projects FOR DELETE
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'manager'
    )
  );

-- Project Members Policies
CREATE POLICY "Users can view project members of their projects"
  ON project_members FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM project_members pm WHERE pm.project_id = project_members.project_id
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'manager'
    )
  );

CREATE POLICY "Project owners can manage members"
  ON project_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = project_members.project_id AND projects.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'manager'
    )
  );

-- Sections Policies
CREATE POLICY "Users can view sections of their projects"
  ON sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members WHERE project_id = sections.project_id AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects WHERE id = sections.project_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Project members can manage sections"
  ON sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_members WHERE project_id = sections.project_id AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM projects WHERE id = sections.project_id AND owner_id = auth.uid()
    )
  );

-- Comments Policies
CREATE POLICY "Users can view comments on tasks they can see"
  ON task_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks WHERE tasks.id = task_comments.task_id
      AND (
        tasks.assignee_id = auth.uid()
        OR tasks.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_members WHERE project_id = tasks.project_id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can add comments to tasks they can see"
  ON task_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks WHERE tasks.id = task_comments.task_id
      AND (
        tasks.assignee_id = auth.uid()
        OR tasks.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_members WHERE project_id = tasks.project_id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update their own comments"
  ON task_comments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON task_comments FOR DELETE
  USING (user_id = auth.uid());

-- Attachments Policies (similar to comments)
CREATE POLICY "Users can view attachments on tasks they can see"
  ON task_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks WHERE tasks.id = task_attachments.task_id
      AND (
        tasks.assignee_id = auth.uid()
        OR tasks.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_members WHERE project_id = tasks.project_id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can add attachments to tasks they can see"
  ON task_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks WHERE tasks.id = task_attachments.task_id
      AND (
        tasks.assignee_id = auth.uid()
        OR tasks.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_members WHERE project_id = tasks.project_id AND user_id = auth.uid()
        )
      )
    )
  );

-- Notifications Policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Tags Policies
CREATE POLICY "Everyone can view tags"
  ON tags FOR SELECT
  USING (true);

CREATE POLICY "Managers can manage tags"
  ON tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'manager'
    )
  );

-- Task Tags Policies
CREATE POLICY "Users can view task tags"
  ON task_tags FOR SELECT
  USING (true);

CREATE POLICY "Users can manage tags on their tasks"
  ON task_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tasks WHERE tasks.id = task_tags.task_id
      AND (
        tasks.assignee_id = auth.uid()
        OR tasks.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_members WHERE project_id = tasks.project_id AND user_id = auth.uid()
        )
      )
    )
  );

-- ============================================
-- Triggers
-- ============================================

-- Update updated_at on projects
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on task_comments
DROP TRIGGER IF EXISTS update_task_comments_updated_at ON task_comments;
CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on custom_field_values
DROP TRIGGER IF EXISTS update_custom_field_values_updated_at ON custom_field_values;
CREATE TRIGGER update_custom_field_values_updated_at
  BEFORE UPDATE ON custom_field_values
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Functions
-- ============================================

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_content TEXT DEFAULT NULL,
  p_link TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, content, link)
  VALUES (p_user_id, p_type, p_title, p_content, p_link)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify on task assignment
CREATE OR REPLACE FUNCTION notify_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assignee_id IS NOT NULL AND (OLD.assignee_id IS NULL OR OLD.assignee_id != NEW.assignee_id) THEN
    PERFORM create_notification(
      NEW.assignee_id,
      'task_assigned',
      'تم تعيين مهمة جديدة لك',
      NEW.title,
      '/tasks/' || NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_task_assignment ON tasks;
CREATE TRIGGER trigger_notify_task_assignment
  AFTER INSERT OR UPDATE OF assignee_id ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assignment();

-- Function to notify on comment
CREATE OR REPLACE FUNCTION notify_task_comment()
RETURNS TRIGGER AS $$
DECLARE
  task_record RECORD;
BEGIN
  SELECT * INTO task_record FROM tasks WHERE id = NEW.task_id;
  
  -- Notify task assignee
  IF task_record.assignee_id IS NOT NULL AND task_record.assignee_id != NEW.user_id THEN
    PERFORM create_notification(
      task_record.assignee_id,
      'task_comment',
      'تعليق جديد على مهمتك',
      task_record.title,
      '/tasks/' || task_record.id
    );
  END IF;
  
  -- Notify task creator
  IF task_record.created_by IS NOT NULL AND task_record.created_by != NEW.user_id AND task_record.created_by != task_record.assignee_id THEN
    PERFORM create_notification(
      task_record.created_by,
      'task_comment',
      'تعليق جديد على مهمة أنشأتها',
      task_record.title,
      '/tasks/' || task_record.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_task_comment ON task_comments;
CREATE TRIGGER trigger_notify_task_comment
  AFTER INSERT ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_comment();
