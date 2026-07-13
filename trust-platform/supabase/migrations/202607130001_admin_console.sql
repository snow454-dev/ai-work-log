create table public.app_admin_emails (
  email public.citext primary key,
  created_at timestamptz not null default now()
);

alter table public.app_admin_emails enable row level security;
alter table public.app_admin_emails force row level security;

revoke all on public.app_admin_emails from anon, authenticated;

insert into public.app_admin_emails (email)
values ('hello@aisupports.cc')
on conflict (email) do nothing;

create table public.beta_invite_hashes (
  email_hash text primary key check (email_hash ~ '^[0-9a-f]{64}$'),
  source_beta_access_request_id uuid not null
    references public.beta_access_requests(id) on delete cascade,
  invited_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index beta_invite_hashes_source_request_idx
  on public.beta_invite_hashes(source_beta_access_request_id);

create index beta_invite_hashes_invited_by_idx
  on public.beta_invite_hashes(invited_by);

alter table public.beta_invite_hashes enable row level security;
alter table public.beta_invite_hashes force row level security;

revoke all on public.beta_invite_hashes from anon, authenticated;

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.app_admin_emails as admin
      where admin.email = lower(coalesce(auth.jwt() ->> 'email', ''))::public.citext
    );
$$;

revoke all on function public.is_current_user_admin() from public;
grant execute on function public.is_current_user_admin() to authenticated;

create or replace function public.is_beta_invite_hash_active(
  p_email_hash text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(p_email_hash, '') ~ '^[0-9a-f]{64}$'
    and exists (
      select 1
      from public.beta_invite_hashes as invite
      where invite.email_hash = p_email_hash
        and invite.revoked_at is null
    );
$$;

revoke all on function public.is_beta_invite_hash_active(text) from public;
grant execute on function public.is_beta_invite_hash_active(text) to anon, authenticated;

create or replace function public.list_admin_beta_access_requests(
  p_status text default null,
  p_intent text default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  id uuid,
  intent text,
  requester_name text,
  work_email text,
  company_name text,
  role text,
  use_case text,
  source_path text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit, 25), 1), 100);
  v_offset integer := least(greatest(coalesce(p_offset, 0), 0), 10000);
begin
  if not public.is_current_user_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;

  if p_status is not null
    and p_status not in ('new', 'reviewing', 'invited', 'declined', 'closed') then
    raise exception 'INVALID_BETA_ACCESS_STATUS' using errcode = 'P0001';
  end if;

  if p_intent is not null and p_intent not in ('developer', 'company') then
    raise exception 'INVALID_BETA_ACCESS_INTENT' using errcode = 'P0001';
  end if;

  return query
  select
    request.id,
    request.intent,
    request.requester_name,
    request.work_email::text,
    request.company_name,
    request.role,
    request.use_case,
    request.source_path,
    request.status,
    request.created_at,
    request.updated_at,
    count(*) over() as total_count
  from public.beta_access_requests as request
  where (p_status is null or request.status = p_status)
    and (p_intent is null or request.intent = p_intent)
  order by request.created_at desc, request.id desc
  limit v_limit
  offset v_offset;
end;
$$;

revoke all on function public.list_admin_beta_access_requests(
  text,
  text,
  integer,
  integer
) from public;
grant execute on function public.list_admin_beta_access_requests(
  text,
  text,
  integer,
  integer
) to authenticated;

create or replace function public.get_admin_beta_access_request(
  p_request_id uuid
)
returns table (
  id uuid,
  intent text,
  requester_name text,
  work_email text,
  company_name text,
  role text,
  use_case text,
  source_path text,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;

  return query
  select
    request.id,
    request.intent,
    request.requester_name,
    request.work_email::text,
    request.company_name,
    request.role,
    request.use_case,
    request.source_path,
    request.status,
    request.created_at,
    request.updated_at
  from public.beta_access_requests as request
  where request.id = p_request_id;
end;
$$;

revoke all on function public.get_admin_beta_access_request(uuid) from public;
grant execute on function public.get_admin_beta_access_request(uuid) to authenticated;

create or replace function public.summarize_admin_beta_access_requests()
returns table (
  status text,
  request_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;

  return query
  with statuses(status, sort_order) as (
    values
      ('new'::text, 1),
      ('reviewing'::text, 2),
      ('invited'::text, 3),
      ('declined'::text, 4),
      ('closed'::text, 5)
  )
  select
    statuses.status,
    count(request.id) as request_count
  from statuses
  left join public.beta_access_requests as request
    on request.status = statuses.status
  group by statuses.status, statuses.sort_order
  order by statuses.sort_order;
end;
$$;

revoke all on function public.summarize_admin_beta_access_requests() from public;
grant execute on function public.summarize_admin_beta_access_requests() to authenticated;

create or replace function public.update_admin_beta_access_request_status(
  p_request_id uuid,
  p_status text
)
returns table (
  id uuid,
  status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.beta_access_requests%rowtype;
begin
  if not public.is_current_user_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;

  if p_status not in ('new', 'reviewing', 'declined', 'closed') then
    raise exception 'INVALID_BETA_ACCESS_STATUS' using errcode = 'P0001';
  end if;

  select *
  into v_request
  from public.beta_access_requests as request
  where request.id = p_request_id
  for update;

  if not found then
    raise exception 'BETA_ACCESS_REQUEST_NOT_FOUND' using errcode = 'P0002';
  end if;

  update public.beta_access_requests as request
  set
    status = p_status,
    updated_at = now()
  where request.id = p_request_id;

  insert into public.audit_events (
    actor_type,
    actor_id,
    event_type,
    object_type,
    object_id,
    metadata
  )
  values (
    'admin',
    (select auth.uid()),
    'beta_access_request.status_changed',
    'beta_access_request',
    p_request_id,
    jsonb_build_object(
      'previous_status', v_request.status,
      'status', p_status
    )
  );

  return query select p_request_id, p_status;
end;
$$;

revoke all on function public.update_admin_beta_access_request_status(
  uuid,
  text
) from public;
grant execute on function public.update_admin_beta_access_request_status(
  uuid,
  text
) to authenticated;

create or replace function public.invite_admin_beta_access_request(
  p_request_id uuid,
  p_email_hash text
)
returns table (
  id uuid,
  status text,
  work_email text,
  requester_name text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.beta_access_requests%rowtype;
begin
  if not public.is_current_user_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;

  if coalesce(p_email_hash, '') !~ '^[0-9a-f]{64}$' then
    raise exception 'INVALID_BETA_INVITE_HASH' using errcode = 'P0001';
  end if;

  select *
  into v_request
  from public.beta_access_requests as request
  where request.id = p_request_id
  for update;

  if not found then
    raise exception 'BETA_ACCESS_REQUEST_NOT_FOUND' using errcode = 'P0002';
  end if;

  insert into public.beta_invite_hashes (
    email_hash,
    source_beta_access_request_id,
    invited_by
  )
  values (
    p_email_hash,
    p_request_id,
    (select auth.uid())
  )
  on conflict (email_hash) do update
  set
    source_beta_access_request_id = excluded.source_beta_access_request_id,
    invited_by = excluded.invited_by,
    updated_at = now(),
    revoked_at = null;

  update public.beta_access_requests as request
  set
    status = 'invited',
    updated_at = now()
  where request.id = p_request_id;

  insert into public.audit_events (
    actor_type,
    actor_id,
    event_type,
    object_type,
    object_id,
    metadata
  )
  values (
    'admin',
    (select auth.uid()),
    'beta_access_request.invited',
    'beta_access_request',
    p_request_id,
    jsonb_build_object(
      'previous_status', v_request.status,
      'status', 'invited'
    )
  );

  return query
  select
    v_request.id,
    'invited'::text,
    v_request.work_email::text,
    v_request.requester_name;
end;
$$;

revoke all on function public.invite_admin_beta_access_request(
  uuid,
  text
) from public;
grant execute on function public.invite_admin_beta_access_request(
  uuid,
  text
) to authenticated;
