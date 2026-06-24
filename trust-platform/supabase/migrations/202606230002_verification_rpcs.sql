alter table public.projects
  add column if not exists reviewer_email public.citext;

drop function if exists public.create_project_draft(
  text,
  text,
  text,
  text,
  public.acquisition_source,
  text,
  text,
  date,
  date,
  text,
  text,
  text,
  numeric,
  text,
  text
);

create or replace function public.create_project_draft(
  p_title text,
  p_company_name text,
  p_company_website text,
  p_company_domain text,
  p_reviewer_email text,
  p_acquisition_source public.acquisition_source,
  p_source_platform_label text,
  p_service_category text,
  p_project_start date,
  p_project_end date,
  p_role_description text,
  p_summary text,
  p_outcome_statement text,
  p_outcome_metric_value numeric,
  p_outcome_metric_unit text,
  p_content_hash text
)
returns table (
  id uuid,
  status public.project_status
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_project_id uuid;
  v_revision_id uuid;
begin
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED' using errcode = '28000';
  end if;

  insert into public.projects (owner_id, reviewer_email)
  values (v_user_id, p_reviewer_email::public.citext)
  returning projects.id into v_project_id;

  insert into public.project_revisions (
    project_id,
    revision_number,
    created_by_type,
    title,
    company_name,
    company_website,
    company_domain,
    acquisition_source,
    source_platform_label,
    service_category,
    project_start,
    project_end,
    role_description,
    summary,
    outcome_statement,
    outcome_metric_value,
    outcome_metric_unit,
    content_hash
  )
  values (
    v_project_id,
    1,
    'professional',
    p_title,
    p_company_name,
    p_company_website,
    p_company_domain::public.citext,
    p_acquisition_source,
    p_source_platform_label,
    p_service_category,
    p_project_start,
    p_project_end,
    p_role_description,
    p_summary,
    p_outcome_statement,
    p_outcome_metric_value,
    p_outcome_metric_unit,
    p_content_hash
  )
  returning project_revisions.id into v_revision_id;

  update public.projects
  set current_revision_id = v_revision_id,
      updated_at = now()
  where projects.id = v_project_id;

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
    v_user_id,
    'project.created',
    'project',
    v_project_id,
    jsonb_build_object(
      'revision_id',
      v_revision_id,
      'acquisition_source',
      p_acquisition_source
    )
  );

  return query
  select v_project_id, 'draft'::public.project_status;
end;
$$;

create unique index if not exists verification_requests_one_active_revision_idx
  on public.verification_requests(project_revision_id)
  where consumed_at is null and revoked_at is null;

create or replace function public.create_verification_request(
  p_project_id uuid,
  p_invitation_token_hash text,
  p_reviewer_email_normalized_hash text,
  p_expires_at timestamptz
)
returns table (
  id uuid,
  reviewer_email public.citext,
  professional_name text,
  project_title text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_project public.projects%rowtype;
  v_revision public.project_revisions%rowtype;
  v_profile_name text;
  v_request_id uuid;
begin
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED' using errcode = '28000';
  end if;

  select *
  into v_project
  from public.projects
  where projects.id = p_project_id
  for update;

  if not found or v_project.owner_id <> v_user_id then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_project.status not in ('draft', 'expired') then
    raise exception 'PROJECT_NOT_SENDABLE' using errcode = 'P0001';
  end if;

  if v_project.current_revision_id is null or v_project.reviewer_email is null then
    raise exception 'PROJECT_INCOMPLETE' using errcode = 'P0001';
  end if;

  update public.project_revisions
  set locked_at = coalesce(locked_at, now())
  where project_revisions.id = v_project.current_revision_id
  returning * into v_revision;

  select profiles.display_name
  into v_profile_name
  from public.profiles
  where profiles.user_id = v_user_id;

  insert into public.verification_requests (
    project_id,
    project_revision_id,
    reviewer_email,
    reviewer_email_normalized_hash,
    invitation_token_hash,
    expires_at
  )
  values (
    v_project.id,
    v_revision.id,
    v_project.reviewer_email,
    p_reviewer_email_normalized_hash,
    p_invitation_token_hash,
    p_expires_at
  )
  returning verification_requests.id into v_request_id;

  update public.projects
  set status = 'sent',
      updated_at = now()
  where projects.id = v_project.id;

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
    v_user_id,
    'verification_request.created',
    'verification_request',
    v_request_id,
    jsonb_build_object('project_id', v_project.id, 'revision_id', v_revision.id)
  );

  return query
  select
    v_request_id,
    v_project.reviewer_email,
    coalesce(v_profile_name, 'The professional'),
    v_revision.title,
    p_expires_at;
end;
$$;

create or replace function public.record_verification_delivery(
  p_request_id uuid,
  p_event_type text,
  p_provider_message_id text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_project_id uuid;
begin
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED' using errcode = '28000';
  end if;

  select vr.project_id
  into v_project_id
  from public.verification_requests vr
  join public.projects p on p.id = vr.project_id
  where vr.id = p_request_id
    and p.owner_id = v_user_id;

  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  insert into public.audit_events (
    actor_type,
    actor_id,
    event_type,
    object_type,
    object_id,
    metadata
  )
  values (
    'system',
    v_user_id,
    p_event_type,
    'verification_request',
    p_request_id,
    jsonb_build_object(
      'project_id',
      v_project_id,
      'provider_message_id',
      p_provider_message_id
    )
  );
end;
$$;

create or replace function public.claim_single_reminder(
  p_request_id uuid,
  p_invitation_token_hash text,
  p_expires_at timestamptz
)
returns table (
  id uuid,
  reviewer_email public.citext,
  professional_name text,
  project_title text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.verification_requests%rowtype;
  v_profile_name text;
  v_project_title text;
begin
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED' using errcode = '28000';
  end if;

  update public.verification_requests vr
  set reminder_count = reminder_count + 1,
      invitation_token_hash = p_invitation_token_hash,
      expires_at = p_expires_at
  from public.projects p
  where vr.id = p_request_id
    and p.id = vr.project_id
    and p.owner_id = v_user_id
    and vr.consumed_at is null
    and vr.revoked_at is null
    and vr.reminder_count = 0
  returning vr.* into v_request;

  if not found then
    raise exception 'REMINDER_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  select profiles.display_name
  into v_profile_name
  from public.profiles
  where profiles.user_id = v_user_id;

  select project_revisions.title
  into v_project_title
  from public.project_revisions
  where project_revisions.id = v_request.project_revision_id;

  return query
  select
    v_request.id,
    v_request.reviewer_email,
    coalesce(v_profile_name, 'The professional'),
    v_project_title,
    p_expires_at;
end;
$$;

create or replace function public.revoke_expired_verification_request(
  p_project_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_revoked_count integer;
begin
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED' using errcode = '28000';
  end if;

  update public.verification_requests vr
  set revoked_at = now()
  from public.projects p
  where p.id = p_project_id
    and p.owner_id = v_user_id
    and vr.project_id = p.id
    and vr.consumed_at is null
    and vr.revoked_at is null
    and vr.expires_at <= now();

  get diagnostics v_revoked_count = row_count;

  if v_revoked_count = 0 then
    raise exception 'NO_EXPIRED_REQUEST' using errcode = 'P0001';
  end if;

  update public.projects
  set status = 'expired',
      updated_at = now()
  where projects.id = p_project_id
    and projects.owner_id = v_user_id;
end;
$$;

revoke all on function public.create_project_draft(
  text,
  text,
  text,
  text,
  text,
  public.acquisition_source,
  text,
  text,
  date,
  date,
  text,
  text,
  text,
  numeric,
  text,
  text
) from public;
grant execute on function public.create_project_draft(
  text,
  text,
  text,
  text,
  text,
  public.acquisition_source,
  text,
  text,
  date,
  date,
  text,
  text,
  text,
  numeric,
  text,
  text
) to authenticated;

revoke all on function public.create_verification_request(uuid, text, text, timestamptz)
  from public;
grant execute on function public.create_verification_request(uuid, text, text, timestamptz)
  to authenticated;

revoke all on function public.record_verification_delivery(uuid, text, text)
  from public;
grant execute on function public.record_verification_delivery(uuid, text, text)
  to authenticated;

revoke all on function public.claim_single_reminder(uuid, text, timestamptz)
  from public;
grant execute on function public.claim_single_reminder(uuid, text, timestamptz)
  to authenticated;

revoke all on function public.revoke_expired_verification_request(uuid)
  from public;
grant execute on function public.revoke_expired_verification_request(uuid)
  to authenticated;
