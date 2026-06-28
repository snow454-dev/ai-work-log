create or replace function public.get_reviewer_review_context(
  p_request_id uuid,
  p_session_hash text
)
returns table (
  request_id uuid,
  project_revision_id uuid,
  reviewer_email public.citext,
  project_title text,
  company_name text,
  acquisition_source public.acquisition_source,
  source_platform_label text,
  service_category text,
  project_start date,
  project_end date,
  role_description text,
  summary text,
  outcome_statement text,
  outcome_metric_value numeric,
  outcome_metric_unit text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select
    vr.id,
    r.id,
    vr.reviewer_email,
    r.title,
    r.company_name,
    r.acquisition_source,
    r.source_platform_label,
    r.service_category,
    r.project_start,
    r.project_end,
    r.role_description,
    r.summary,
    r.outcome_statement,
    r.outcome_metric_value,
    r.outcome_metric_unit
  from public.reviewer_sessions rs
  join public.verification_requests vr on vr.id = rs.verification_request_id
  join public.project_revisions r on r.id = vr.project_revision_id
  where vr.id = p_request_id
    and rs.session_token_hash = p_session_hash
    and rs.purpose = 'review'
    and rs.revoked_at is null
    and rs.expires_at > now()
    and vr.consumed_at is not null
    and vr.revoked_at is null;
end;
$$;

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
      v_project_status
    )
  );

  return query select v_verification_id, v_project_status;
end;
$$;

revoke all on function public.get_reviewer_review_context(uuid, text) from public;
grant execute on function public.get_reviewer_review_context(uuid, text)
  to anon, authenticated;

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
