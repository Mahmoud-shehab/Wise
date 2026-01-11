-- Create tables
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  role text check (role in ('manager', 'employee')) default 'employee',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  status text check (status in ('backlog', 'assigned', 'in_progress', 'done', 'blocked')) default 'backlog',
  assignee_id uuid references profiles(id),
  created_by uuid references profiles(id) default auth.uid(),
  due_date date,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table task_activity (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  actor_id uuid references profiles(id) default auth.uid(),
  action text not null,
  from_status text,
  to_status text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;
alter table tasks enable row level security;
alter table task_activity enable row level security;

-- Policies for Profiles
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- Policies for Tasks
-- Manager can do everything
create policy "Managers can do everything on tasks"
  on tasks
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'manager'
    )
  );

-- Employees: View assigned or unassigned (for picking up)
create policy "Employees can view assigned or unassigned tasks"
  on tasks for select
  using (
    (assignee_id = auth.uid() or assignee_id is null)
    and
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'employee'
    )
  );

-- Employees: Update assigned tasks only
create policy "Employees can update assigned tasks"
  on tasks for update
  using (
    assignee_id = auth.uid()
    and
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'employee'
    )
  );

-- Policies for Activity
create policy "Managers view all activity"
  on task_activity for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'manager'
    )
  );

create policy "Employees view activity of their tasks"
  on task_activity for select
  using (
    exists (
      select 1 from tasks
      where tasks.id = task_activity.task_id
      and tasks.assignee_id = auth.uid()
    )
  );

create policy "Everyone can insert activity"
  on task_activity for insert
  with check ( auth.uid() = actor_id );


-- Realtime
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table task_activity;

-- Function to handle user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'employee');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
