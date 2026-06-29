create index if not exists reference_requests_evidence_requester_recent_idx
  on public.reference_requests (
    published_evidence_id,
    requester_email,
    created_at desc
  );

create index if not exists reference_requests_profile_requester_recent_idx
  on public.reference_requests (
    profile_id,
    requester_email,
    created_at desc
  );

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
  v_requester_email public.citext;
  v_reference_request_id uuid;
begin
  v_requester_email := lower(btrim(p_requester_email::text))::public.citext;

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

  if exists (
    select 1
    from public.reference_requests rr
    where rr.published_evidence_id = v_evidence.id
      and rr.requester_email = v_requester_email
      and rr.created_at > now() - interval '24 hours'
  ) then
    raise exception 'REFERENCE_REQUEST_RATE_LIMITED' using errcode = 'P0001';
  end if;

  if (
    select count(*)
    from public.reference_requests rr
    where rr.profile_id = v_evidence.profile_id
      and rr.requester_email = v_requester_email
      and rr.created_at > now() - interval '24 hours'
  ) >= 3 then
    raise exception 'REFERENCE_REQUEST_RATE_LIMITED' using errcode = 'P0001';
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
    v_requester_email,
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

create or replace function public.update_reference_request_status(
  p_reference_request_id uuid,
  p_status public.reference_request_status
)
returns table (
  reference_request_id uuid,
  status public.reference_request_status
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reference_request public.reference_requests%rowtype;
begin
  if p_status not in ('accepted', 'declined') then
    raise exception 'INVALID_REFERENCE_REQUEST_STATUS' using errcode = 'P0001';
  end if;

  select *
  into v_reference_request
  from public.reference_requests rr
  where rr.id = p_reference_request_id
    and rr.owner_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'REFERENCE_REQUEST_NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_reference_request.status <> 'pending' then
    raise exception 'REFERENCE_REQUEST_ALREADY_DECIDED' using errcode = 'P0001';
  end if;

  update public.reference_requests
  set status = p_status,
      updated_at = now()
  where id = v_reference_request.id;

  insert into public.audit_events (
    actor_type,
    actor_id,
    event_type,
    object_type,
    object_id,
    metadata
  )
  values (
    'professional',
    (select auth.uid()),
    'reference_request.status_updated',
    'reference_request',
    v_reference_request.id,
    jsonb_build_object('status', p_status)
  );

  return query select v_reference_request.id, p_status;
end;
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

revoke all on function public.update_reference_request_status(
  uuid,
  public.reference_request_status
) from public;
grant execute on function public.update_reference_request_status(
  uuid,
  public.reference_request_status
) to authenticated;
