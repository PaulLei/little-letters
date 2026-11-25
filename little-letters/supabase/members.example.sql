-- First create the TWO users in Supabase Authentication > Users > Add user.
-- Give each a password and enable Auto Confirm User. Disable public signups.
-- Replace these two addresses, then run this query in the SQL Editor.
-- Their passwords and UUIDs do NOT go in GitHub.
insert into public.members (user_id, role)
select id, 'admin' from auth.users where lower(email) = lower('YOUR_EMAIL@example.com');

insert into public.members (user_id, role)
select id, 'reader' from auth.users where lower(email) = lower('READER_EMAIL@example.com');

-- This should return exactly two rows. If it does not, check the addresses above.
select m.role, u.email from public.members m join auth.users u on u.id = m.user_id;
