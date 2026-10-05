-- Vesco Intelligence: run once in Supabase > SQL Editor > New query.
-- The FIRST account to sign up becomes admin; later accounts start as viewers.

create table members(user_id uuid primary key references auth.users on delete cascade, email text, role text not null default 'viewer' check (role in ('admin','editor','viewer')));
create table apps(id uuid primary key default gen_random_uuid(), data jsonb not null default '{}', shared boolean not null default false, created_at timestamptz default now());
create table oem(id uuid primary key default gen_random_uuid(), data jsonb not null default '{}', created_at timestamptz default now());
alter table members enable row level security;
alter table apps enable row level security;
alter table oem enable row level security;

create function role_of() returns text language sql stable security definer set search_path=public as $$ select role from members where user_id=auth.uid() $$;

create function on_signup() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into members(user_id,email,role) values (new.id,new.email, case when exists(select 1 from members) then 'viewer' else 'admin' end);
  return new;
end $$;
create trigger t_signup after insert on auth.users for each row execute function on_signup();

create policy m_read on members for select using (role_of() is not null);
create policy m_admin on members for update using (role_of()='admin');

create policy a_read on apps for select using (role_of() is not null);
create policy a_ins  on apps for insert with check (role_of() in ('admin','editor'));
create policy a_upd  on apps for update using (role_of() in ('admin','editor'));
create policy a_del  on apps for delete using (role_of()='admin');

create policy o_read on oem for select using (role_of() is not null);
create policy o_ins  on oem for insert with check (role_of() in ('admin','editor'));
create policy o_upd  on oem for update using (role_of() in ('admin','editor'));
create policy o_del  on oem for delete using (role_of()='admin');

-- Public, customer-safe view of ONE shared application (used by QR links)
create function get_shared(app_id uuid) returns jsonb language sql stable security definer set search_path=public as $$
  select jsonb_build_object('name',data->'name','industry',data->'industry','product',data->'product',
    'desc',coalesce(nullif(data->>'summary',''),data->>'desc'),'problem',data->'problem','solution',data->'solution','proof',data->'proof','photos',data->'photos')
  from apps where id=app_id and shared $$;
grant execute on function get_shared(uuid) to anon, authenticated;

-- File storage (photos and OEM PDFs). Files have unguessable paths.
insert into storage.buckets(id,name,public) values ('photos','photos',true),('oem','oem',true) on conflict do nothing;
create policy s_up  on storage.objects for insert to authenticated with check (bucket_id in ('photos','oem') and role_of() in ('admin','editor'));
create policy s_del on storage.objects for delete to authenticated using (bucket_id in ('photos','oem') and role_of()='admin');
