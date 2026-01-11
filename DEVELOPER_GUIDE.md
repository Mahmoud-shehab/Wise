# Developer Guide - Wise Tasks (Asana Clone)

## 🏗️ Project Structure

```
wise-task-manager/
├── src/
│   ├── components/
│   │   ├── project/
│   │   │   ├── BoardView.tsx          # Kanban board with drag & drop
│   │   │   └── ListView.tsx           # List view for tasks
│   │   ├── task/
│   │   │   ├── TaskComments.tsx       # Comments component
│   │   │   ├── TaskAttachments.tsx    # File attachments
│   │   │   └── SubTasks.tsx           # Subtasks management
│   │   ├── ui/
│   │   │   └── Badge.tsx              # Status & Priority badges
│   │   ├── AuthGuard.tsx              # Route protection
│   │   ├── Layout.tsx                 # Main layout with sidebar
│   │   └── NotificationDropdown.tsx   # Notifications dropdown
│   ├── features/
│   │   ├── auth/
│   │   │   ├── AuthContext.tsx        # Auth state management
│   │   │   └── Login.tsx              # Login page
│   │   └── tasks/
│   │       ├── ActivityLog.tsx        # Task activity log
│   │       └── TaskCard.tsx           # Task card component
│   ├── routes/
│   │   ├── DashboardPage.tsx          # Dashboard
│   │   ├── TasksPage.tsx              # My tasks
│   │   ├── AllTasksPage.tsx           # All tasks
│   │   ├── TaskDetailsPage.tsx        # Task details
│   │   ├── TaskTypesPage.tsx          # Task types management
│   │   ├── CompaniesPage.tsx          # Companies management
│   │   ├── AdminPage.tsx              # Employee management
│   │   ├── ReportsPage.tsx            # Reports & analytics
│   │   ├── ProjectsPage.tsx           # Projects listing
│   │   └── ProjectDetailPage.tsx      # Project details
│   ├── lib/
│   │   └── supabaseClient.ts          # Supabase client setup
│   ├── types/
│   │   ├── database.types.ts          # Database types (auto-generated)
│   │   └── database-extended.types.ts # Extended types
│   ├── App.tsx                        # Main app component
│   ├── main.tsx                       # Entry point
│   └── index.css                      # Global styles
├── supabase/
│   └── migrations/
│       ├── 20240101_init.sql                          # Initial schema
│       ├── 20240102_companies_and_task_types.sql      # Companies & task types
│       ├── 20240103_fix_profiles_permissions.sql      # Permissions fix
│       └── 20240104_asana_features.sql                # Asana features
├── public/                            # Static assets
├── dist/                              # Build output
└── package.json                       # Dependencies
```

## 🗄️ Database Schema

### Core Tables
- `profiles` - User profiles (linked to auth.users)
- `companies` - Companies/clients
- `task_types` - Task categories
- `tasks` - Main tasks table

### Asana Features Tables
- `projects` - Projects container
- `sections` - Task sections within projects
- `project_members` - Project team members
- `task_comments` - Task comments
- `task_attachments` - File attachments
- `notifications` - User notifications
- `task_dependencies` - Task relationships
- `custom_fields` - Dynamic fields per project
- `custom_field_values` - Custom field values
- `project_templates` - Reusable templates
- `tags` - Task tags
- `task_tags` - Task-tag relationships

## 🔐 Authentication & Authorization

### Auth Flow
1. User logs in via Supabase Auth
2. Profile is fetched from `profiles` table
3. Role-based access control (Manager/Employee)
4. RLS policies enforce permissions

### Roles
- **Manager**: Full CRUD access to all resources
- **Employee**: Limited access, can only modify assigned tasks

### RLS Policies
All tables have Row Level Security enabled:
```sql
-- Example: Managers can do everything
CREATE POLICY "Managers full access" ON projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

-- Example: Employees can read
CREATE POLICY "Employees can read" ON projects
  FOR SELECT USING (true);
```

## 🎨 UI Components

### Design System
- **Framework**: React + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Fonts**: Cairo (Arabic)
- **Direction**: RTL (Right-to-Left)

### Key Components

#### BoardView
```typescript
<BoardView
  projectId={projectId}
  sections={sections}
  tasks={tasks}
  onRefresh={fetchData}
/>
```
Features:
- Drag & drop tasks between sections
- Add tasks inline
- Visual Kanban board

#### ListView
```typescript
<ListView
  projectId={projectId}
  sections={sections}
  tasks={tasks}
  onRefresh={fetchData}
/>
```
Features:
- Organized list by sections
- Task details preview
- Quick add tasks

#### TaskComments
```typescript
<TaskComments taskId={taskId} />
```
Features:
- Real-time comments
- User attribution
- Timestamp display

#### TaskAttachments
```typescript
<TaskAttachments taskId={taskId} />
```
Features:
- File upload to Supabase Storage
- Download/delete files
- File size and type display

#### SubTasks
```typescript
<SubTasks taskId={taskId} projectId={projectId} />
```
Features:
- Nested subtasks
- Progress tracking
- Quick complete/uncomplete

## 🔔 Notifications System

### Implementation
```typescript
// Subscribe to notifications
const channel = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    },
    handleNewNotification
  )
  .subscribe();
```

### Triggers
Notifications are automatically created via database triggers:
- Task assignment
- New comments
- Status changes

## 📦 State Management

### Auth Context
```typescript
const { user, profile, signOut } = useAuth();
```

### Local State
- React useState for component state
- useEffect for data fetching
- No global state management (Redux/Zustand) needed yet

## 🚀 API Calls

### Supabase Client
```typescript
import { supabase } from '@/lib/supabaseClient';

// Fetch data
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('project_id', projectId);

// Insert data
const { error } = await supabase
  .from('tasks')
  .insert({ title, project_id });

// Update data
const { error } = await supabase
  .from('tasks')
  .update({ status: 'done' })
  .eq('id', taskId);

// Delete data
const { error } = await supabase
  .from('tasks')
  .delete()
  .eq('id', taskId);
```

### File Upload
```typescript
// Upload to Storage
const { error } = await supabase.storage
  .from('attachments')
  .upload(filePath, file);

// Get public URL
const { data } = supabase.storage
  .from('attachments')
  .getPublicUrl(filePath);
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] Create project
- [ ] Add sections
- [ ] Create tasks
- [ ] Drag & drop tasks
- [ ] Add subtasks
- [ ] Add comments
- [ ] Upload attachments
- [ ] Check notifications
- [ ] Test permissions (Manager vs Employee)

### Future: Automated Tests
```typescript
// Example test structure
describe('ProjectsPage', () => {
  it('should create a new project', async () => {
    // Test implementation
  });
});
```

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation
```bash
# Clone repository
git clone <repo-url>

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 📝 Code Style

### TypeScript
- Use strict mode
- Define interfaces for all props
- Use type inference where possible
- Avoid `any` type

### React
- Functional components only
- Use hooks (useState, useEffect, etc.)
- Extract reusable logic to custom hooks
- Keep components small and focused

### Naming Conventions
- Components: PascalCase (e.g., `TaskCard.tsx`)
- Functions: camelCase (e.g., `fetchTasks`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_URL`)
- Files: PascalCase for components, camelCase for utilities

### CSS
- Use Tailwind utility classes
- Avoid custom CSS when possible
- Use `dir="rtl"` for Arabic layout
- Responsive design: mobile-first

## 🐛 Debugging

### Common Issues

**Issue**: Tasks not loading
```typescript
// Check console for errors
console.error('Error fetching tasks:', error);

// Verify RLS policies
// Check Supabase dashboard > Authentication > Policies
```

**Issue**: File upload fails
```typescript
// Ensure bucket exists
// Check Storage > Buckets > attachments

// Verify bucket policies
// Public or authenticated access
```

**Issue**: Notifications not working
```typescript
// Check Realtime is enabled
// Supabase dashboard > Settings > API > Realtime

// Verify trigger exists
// Database > Functions > notify_task_assignment
```

## 🚀 Deployment

### Build
```bash
npm run build
```

### Deploy to Vercel
```bash
vercel --prod
```

### Deploy to Netlify
```bash
netlify deploy --prod
```

### Environment Variables
Set these in your deployment platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 📚 Resources

### Documentation
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vite Docs](https://vitejs.dev)

### Libraries
- `react-router-dom` - Routing
- `lucide-react` - Icons
- `date-fns` - Date formatting
- `clsx` - Conditional classes

## 🤝 Contributing

### Adding New Features
1. Create feature branch
2. Implement feature
3. Test thoroughly
4. Update documentation
5. Create pull request

### Code Review Checklist
- [ ] Code follows style guide
- [ ] TypeScript types are correct
- [ ] RLS policies are in place
- [ ] UI is responsive
- [ ] Arabic/RTL support
- [ ] No console errors
- [ ] Performance is acceptable

## 📞 Support

For issues or questions:
1. Check documentation
2. Review console errors
3. Check Supabase logs
4. Contact team lead

---

**Happy Coding! 🎉**
