-- Fix handle_new_user function to respect role from metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'employee')  -- Use role from metadata if provided, otherwise default to 'employee'
  );
  return new;
end;
$$ language plpgsql security definer;
