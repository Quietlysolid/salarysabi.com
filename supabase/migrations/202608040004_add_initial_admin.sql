insert into public.admin_users (user_id)
values ('f4600019-b3b2-4af7-a5b2-e5cce32c98ad')
on conflict (user_id) do nothing;
