create type public.reference_request_status as enum (
  'pending',
  'accepted',
  'declined',
  'expired'
);

alter table public.published_evidence
  add constraint published_evidence_owner_id_id_unique unique(owner_id, id);

create table public.reference_requests (
  id uuid primary key default gen_random_uuid(),
  published_evidence_id uuid not null references public.published_evidence(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  requester_name text not null check (char_length(requester_name) between 1 and 120),
  requester_email public.citext not null check (char_length(requester_email::text) <= 254),
  requester_company text not null check (char_length(requester_company) between 1 and 160),
  requester_role text check (
    requester_role is null or char_length(requester_role) between 1 and 160
  ),
  opportunity_context text not null check (
    char_length(opportunity_context) between 10 and 1000
  ),
  message text check (message is null or char_length(message) <= 1000),
  status public.reference_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reference_requests_evidence_owner_fk
    foreign key (owner_id, published_evidence_id)
    references public.published_evidence(owner_id, id) on delete cascade,
  constraint reference_requests_profile_owner_fk
    foreign key (owner_id, profile_id)
    references public.profiles(user_id, id) on delete cascade
);

create index reference_requests_owner_created_idx
  on public.reference_requests(owner_id, created_at desc);
create index reference_requests_evidence_idx
  on public.reference_requests(published_evidence_id, created_at desc);

alter table public.reference_requests enable row level security;
alter table public.reference_requests force row level security;

create policy reference_requests_owner_select on public.reference_requests
  for select to authenticated
  using ((select auth.uid()) = owner_id);

grant select on public.reference_requests to authenticated;

create or replace function public.create_reference_request(
  p_slug text,
  p_evidence_id uuid,
  p_requester_name text,
  p_requester_email public.citext,
  p_requester_company text,
  p_requester_role text,
  p_opportunity_context text,
  p_message text
)
returns table (
  reference_request_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_evidence public.published_evidence%rowtype;
  v_reference_request_id uuid;
begin
  select e.*
  into v_evidence
  from public.published_evidence e
  join public.profiles p on p.id = e.profile_id
  where p.slug = lower(p_slug)::public.citext
    and p.is_public = true
    and e.id = p_evidence_id
    and e.active = true
    and e.public_reference_available = true;

  if not found then
    raise exception 'REFERENCE_REQUEST_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  insert into public.reference_requests (
    published_evidence_id,
    owner_id,
    profile_id,
    requester_name,
    requester_email,
    requester_company,
    requester_role,
    opportunity_context,
    message
  )
  values (
    v_evidence.id,
    v_evidence.owner_id,
    v_evidence.profile_id,
    btrim(p_requester_name),
    lower(btrim(p_requester_email::text))::public.citext,
    btrim(p_requester_company),
    nullif(btrim(coalesce(p_requester_role, '')), ''),
    btrim(p_opportunity_context),
    nullif(btrim(coalesce(p_message, '')), '')
  )
  returning id into v_reference_request_id;

  insert into public.audit_events (
    actor_type,
    event_type,
    object_type,
    object_id,
    metadata
  )
  values (
    'system',
    'reference_request.created',
    'reference_request',
    v_reference_request_id,
    jsonb_build_object(
      'profile_id',
      v_evidence.profile_id,
      'published_evidence_id',
      v_evidence.id
    )
  );

  return query select v_reference_request_id;
end;
$$;

create or replace function public.list_reference_requests_for_owner()
returns table (
  reference_request_id uuid,
  published_evidence_id uuid,
  public_title text,
  requester_name text,
  requester_email public.citext,
  requester_company text,
  requester_role text,
  opportunity_context text,
  message text,
  status public.reference_request_status,
  created_at timestamptz
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    rr.id,
    rr.published_evidence_id,
    e.public_title,
    rr.requester_name,
    rr.requester_email,
    rr.requester_company,
    rr.requester_role,
    rr.opportunity_context,
    rr.message,
    rr.status,
    rr.created_at
  from public.reference_requests rr
  join public.published_evidence e on e.id = rr.published_evidence_id
  where rr.owner_id = (select auth.uid())
  order by rr.created_at desc
  limit 25;
$$;

revoke all on function public.create_reference_request(
  text,
  uuid,
  text,
  public.citext,
  text,
  text,
  text,
  text
) from public;
grant execute on function public.create_reference_request(
  text,
  uuid,
  text,
  public.citext,
  text,
  text,
  text,
  text
) to anon, authenticated;

revoke all on function public.list_reference_requests_for_owner() from public;
grant execute on function public.list_reference_requests_for_owner()
  to authenticated;
