create table public.beta_access_requests (
  id uuid primary key default gen_random_uuid(),
  intent text not null check (intent in ('developer', 'company')),
  requester_name text not null check (char_length(requester_name) between 1 and 120),
  work_email public.citext not null check (char_length(work_email::text) <= 254),
  company_name text check (
    company_name is null or char_length(company_name) between 1 and 160
  ),
  role text check (
    role is null or char_length(role) between 1 and 160
  ),
  use_case text not null check (char_length(use_case) between 10 and 1000),
  source_path text check (
    source_path is null or char_length(source_path) between 1 and 200
  ),
  status text not null default 'new' check (
    status in ('new', 'reviewing', 'invited', 'declined', 'closed')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index beta_access_requests_status_created_idx
  on public.beta_access_requests(status, created_at desc);

create index beta_access_requests_email_created_idx
  on public.beta_access_requests(work_email, created_at desc);

alter table public.beta_access_requests enable row level security;
alter table public.beta_access_requests force row level security;

revoke all on public.beta_access_requests from anon, authenticated;

create or replace function public.create_beta_access_request(
  p_intent text,
  p_requester_name text,
  p_work_email public.citext,
  p_company_name text,
  p_role text,
  p_use_case text,
  p_source_path text
)
returns table (
  beta_access_request_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request_id uuid;
begin
  if p_intent not in ('developer', 'company') then
    raise exception 'INVALID_BETA_ACCESS_INTENT' using errcode = 'P0001';
  end if;

  insert into public.beta_access_requests (
    intent,
    requester_name,
    work_email,
    company_name,
    role,
    use_case,
    source_path
  )
  values (
    p_intent,
    btrim(p_requester_name),
    lower(btrim(p_work_email::text))::public.citext,
    nullif(btrim(coalesce(p_company_name, '')), ''),
    nullif(btrim(coalesce(p_role, '')), ''),
    btrim(p_use_case),
    nullif(btrim(coalesce(p_source_path, '')), '')
  )
  returning id into v_request_id;

  insert into public.audit_events (
    actor_type,
    event_type,
    object_type,
    object_id,
    metadata
  )
  values (
    'system',
    'beta_access_request.created',
    'beta_access_request',
    v_request_id,
    jsonb_build_object('intent', p_intent)
  );

  return query select v_request_id;
end;
$$;

revoke all on function public.create_beta_access_request(
  text,
  text,
  public.citext,
  text,
  text,
  text,
  text
) from public;

grant execute on function public.create_beta_access_request(
  text,
  text,
  public.citext,
  text,
  text,
  text,
  text
) to anon, authenticated;
