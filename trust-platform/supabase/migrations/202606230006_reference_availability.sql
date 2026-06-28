alter table public.verifications
  add column open_to_reference_requests boolean not null default false;

alter table public.published_evidence
  add column public_reference_available boolean not null default false;

drop function if exists public.submit_verification(
  uuid,
  text,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  public.rehire_response,
  public.sharing_preference,
  text,
  text,
  text,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  text
);

create or replace function public.submit_verification(
  p_request_id uuid,
  p_session_hash text,
  p_project_existed boolean,
  p_source_accurate boolean,
  p_role_accurate boolean,
  p_outcome_accurate boolean,
  p_metric_accurate boolean,
  p_rehire_response public.rehire_response,
  p_sharing_preference public.sharing_preference,
  p_open_to_reference_requests boolean,
  p_reviewer_name text,
  p_reviewer_job_title text,
  p_reviewer_comment text,
  p_show_company_name boolean,
  p_show_acquisition_source boolean,
  p_show_reviewer_name boolean,
  p_show_reviewer_job_title boolean,
  p_show_project_period boolean,
  p_show_outcome_statement boolean,
  p_show_outcome_metric boolean,
  p_show_reviewer_comment boolean,
  p_show_rehire_response boolean,
  p_receipt_token_hash text
)
returns table (
  verification_id uuid,
  status public.project_status
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.verification_requests%rowtype;
  v_approved boolean;
  v_verification_id uuid;
  v_project_status public.project_status;
begin
  select vr.*
  into v_request
  from public.verification_requests vr
  join public.reviewer_sessions rs on rs.verification_request_id = vr.id
  where vr.id = p_request_id
    and rs.session_token_hash = p_session_hash
    and rs.purpose = 'review'
    and rs.revoked_at is null
    and rs.expires_at > now()
    and vr.revoked_at is null
  for update of vr;

  if not found then
    raise exception 'INVALID_REVIEWER_SESSION' using errcode = 'P0001';
  end if;

  if p_open_to_reference_requests
    and p_sharing_preference = 'not_now'
  then
    raise exception 'REFERENCE_REQUESTS_NOT_SHAREABLE' using errcode = 'P0001';
  end if;

  v_approved :=
    p_project_existed
    and p_source_accurate
    and p_role_accurate
    and p_outcome_accurate
    and coalesce(p_metric_accurate, true);
  v_project_status := case
    when v_approved then 'verified'::public.project_status
    else 'declined'::public.project_status
  end;

  insert into public.verifications (
    project_id,
    verification_request_id,
    approved_revision_id,
    project_existed,
    source_accurate,
    role_accurate,
    outcome_accurate,
    metric_accurate,
    rehire_response,
    sharing_preference,
    open_to_reference_requests,
    reviewer_name,
    reviewer_job_title,
    reviewer_comment,
    show_company_name,
    show_acquisition_source,
    show_reviewer_name,
    show_reviewer_job_title,
    show_project_period,
    show_outcome_statement,
    show_outcome_metric,
    show_reviewer_comment,
    show_rehire_response,
    company_domain_verified,
    reviewer_receipt_token_hash
  )
  values (
    v_request.project_id,
    v_request.id,
    case when v_approved then v_request.project_revision_id else null end,
    p_project_existed,
    p_source_accurate,
    p_role_accurate,
    p_outcome_accurate,
    p_metric_accurate,
    p_rehire_response,
    p_sharing_preference,
    p_open_to_reference_requests,
    p_reviewer_name,
    p_reviewer_job_title,
    p_reviewer_comment,
    p_show_company_name,
    p_show_acquisition_source,
    p_show_reviewer_name,
    p_show_reviewer_job_title,
    p_show_project_period,
    p_show_outcome_statement,
    p_show_outcome_metric,
    p_show_reviewer_comment,
    p_show_rehire_response,
    v_approved,
    p_receipt_token_hash
  )
  returning verifications.id into v_verification_id;

  update public.verification_requests
  set consumed_at = coalesce(consumed_at, now())
  where verification_requests.id = v_request.id;

  update public.reviewer_sessions
  set revoked_at = now()
  where reviewer_sessions.verification_request_id = v_request.id;

  update public.projects
  set status = v_project_status,
      verified_revision_id = case
        when v_approved then v_request.project_revision_id
        else verified_revision_id
      end,
      updated_at = now()
  where projects.id = v_request.project_id;

  insert into public.audit_events (
    actor_type,
    event_type,
    object_type,
    object_id,
    metadata
  )
  values (
    'reviewer',
    'verification.submitted',
    'verification',
    v_verification_id,
    jsonb_build_object(
      'project_id',
      v_request.project_id,
      'status',
      v_project_status,
      'open_to_reference_requests',
      p_open_to_reference_requests
    )
  );

  return query select v_verification_id, v_project_status;
end;
$$;

create or replace function public.publish_verified_evidence(
  p_project_id uuid
)
returns table (
  evidence_id uuid,
  profile_slug text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project public.projects%rowtype;
  v_profile public.profiles%rowtype;
  v_revision public.project_revisions%rowtype;
  v_verification public.verifications%rowtype;
  v_evidence_id uuid;
begin
  select *
  into v_project
  from public.projects
  where id = p_project_id
    and owner_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'PROJECT_NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_project.verified_revision_id is null then
    raise exception 'PROJECT_NOT_VERIFIED' using errcode = 'P0001';
  end if;

  select *
  into v_profile
  from public.profiles
  where user_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'PROFILE_REQUIRED' using errcode = 'P0001';
  end if;

  select *
  into v_revision
  from public.project_revisions
  where id = v_project.verified_revision_id
    and project_id = v_project.id;

  if not found then
    raise exception 'VERIFIED_REVISION_NOT_FOUND' using errcode = 'P0001';
  end if;

  select *
  into v_verification
  from public.verifications
  where project_id = v_project.id
    and approved_revision_id = v_project.verified_revision_id
    and company_domain_verified = true
    and consent_status = 'active'
    and withdrawn_at is null
    and disputed_at is null
  order by submitted_at desc
  limit 1;

  if not found
    or v_verification.sharing_preference <> 'share_public_profile'
  then
    raise exception 'PUBLIC_SHARING_NOT_APPROVED' using errcode = 'P0001';
  end if;

  update public.profiles
  set is_public = true,
      updated_at = now()
  where id = v_profile.id;

  insert into public.published_evidence (
    owner_id,
    profile_id,
    project_id,
    public_title,
    public_service_category,
    public_company_name,
    public_acquisition_source,
    public_source_platform_label,
    public_project_start,
    public_project_end,
    public_outcome_statement,
    public_outcome_metric_value,
    public_outcome_metric_unit,
    public_reviewer_name,
    public_reviewer_job_title,
    public_reviewer_comment,
    public_rehire_response,
    public_reference_available,
    verification_badge,
    published_at,
    active
  )
  values (
    v_project.owner_id,
    v_profile.id,
    v_project.id,
    v_revision.title,
    v_revision.service_category,
    case
      when v_verification.show_company_name then v_revision.company_name
      else null
    end,
    case
      when v_verification.show_acquisition_source then v_revision.acquisition_source
      else null
    end,
    case
      when v_verification.show_acquisition_source then v_revision.source_platform_label
      else null
    end,
    case
      when v_verification.show_project_period then v_revision.project_start
      else null
    end,
    case
      when v_verification.show_project_period then v_revision.project_end
      else null
    end,
    case
      when v_verification.show_outcome_statement then v_revision.outcome_statement
      else null
    end,
    case
      when v_verification.show_outcome_metric then v_revision.outcome_metric_value
      else null
    end,
    case
      when v_verification.show_outcome_metric then v_revision.outcome_metric_unit
      else null
    end,
    case
      when v_verification.show_reviewer_name then v_verification.reviewer_name
      else null
    end,
    case
      when v_verification.show_reviewer_job_title then v_verification.reviewer_job_title
      else null
    end,
    case
      when v_verification.show_reviewer_comment then v_verification.reviewer_comment
      else null
    end,
    case
      when v_verification.show_rehire_response then v_verification.rehire_response
      else null
    end,
    v_verification.open_to_reference_requests,
    'company_domain_verified',
    now(),
    true
  )
  on conflict (project_id) do update
  set owner_id = excluded.owner_id,
      profile_id = excluded.profile_id,
      public_title = excluded.public_title,
      public_service_category = excluded.public_service_category,
      public_company_name = excluded.public_company_name,
      public_acquisition_source = excluded.public_acquisition_source,
      public_source_platform_label = excluded.public_source_platform_label,
      public_project_start = excluded.public_project_start,
      public_project_end = excluded.public_project_end,
      public_outcome_statement = excluded.public_outcome_statement,
      public_outcome_metric_value = excluded.public_outcome_metric_value,
      public_outcome_metric_unit = excluded.public_outcome_metric_unit,
      public_reviewer_name = excluded.public_reviewer_name,
      public_reviewer_job_title = excluded.public_reviewer_job_title,
      public_reviewer_comment = excluded.public_reviewer_comment,
      public_rehire_response = excluded.public_rehire_response,
      public_reference_available = excluded.public_reference_available,
      verification_badge = excluded.verification_badge,
      published_at = now(),
      active = true
  returning id into v_evidence_id;

  update public.projects
  set status = 'published',
      published_at = now(),
      updated_at = now()
  where id = v_project.id;

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
    'published_evidence.published',
    'published_evidence',
    v_evidence_id,
    jsonb_build_object(
      'project_id',
      v_project.id,
      'public_reference_available',
      v_verification.open_to_reference_requests
    )
  );

  return query select v_evidence_id, v_profile.slug::text;
end;
$$;

drop function if exists public.list_public_evidence(text);

create or replace function public.list_public_evidence(
  p_slug text
)
returns table (
  evidence_id uuid,
  public_title text,
  public_service_category text,
  public_company_name text,
  public_acquisition_source public.acquisition_source,
  public_source_platform_label text,
  public_project_start date,
  public_project_end date,
  public_outcome_statement text,
  public_outcome_metric_value numeric,
  public_outcome_metric_unit text,
  public_reviewer_name text,
  public_reviewer_job_title text,
  public_reviewer_comment text,
  public_rehire_response public.rehire_response,
  public_reference_available boolean,
  verification_badge text,
  published_at timestamptz
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    e.id,
    e.public_title,
    e.public_service_category,
    e.public_company_name,
    e.public_acquisition_source,
    e.public_source_platform_label,
    e.public_project_start,
    e.public_project_end,
    e.public_outcome_statement,
    e.public_outcome_metric_value,
    e.public_outcome_metric_unit,
    e.public_reviewer_name,
    e.public_reviewer_job_title,
    e.public_reviewer_comment,
    e.public_rehire_response,
    e.public_reference_available,
    e.verification_badge,
    e.published_at
  from public.profiles p
  join public.published_evidence e on e.profile_id = p.id
  where p.slug = lower(p_slug)::public.citext
    and p.is_public = true
    and e.active = true
  order by e.published_at desc;
$$;

revoke all on function public.submit_verification(
  uuid,
  text,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  public.rehire_response,
  public.sharing_preference,
  boolean,
  text,
  text,
  text,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  text
) from public;
grant execute on function public.submit_verification(
  uuid,
  text,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  public.rehire_response,
  public.sharing_preference,
  boolean,
  text,
  text,
  text,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  text
) to anon, authenticated;

revoke all on function public.publish_verified_evidence(uuid) from public;
grant execute on function public.publish_verified_evidence(uuid)
  to authenticated;

revoke all on function public.list_public_evidence(text) from public;
grant execute on function public.list_public_evidence(text)
  to anon, authenticated;
