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
    jsonb_build_object('project_id', v_project.id)
  );

  return query select v_evidence_id, v_profile.slug::text;
end;
$$;

create or replace function public.get_public_profile(
  p_slug text
)
returns table (
  profile_id uuid,
  slug text,
  display_name text,
  headline text,
  bio text,
  country_code text,
  time_zone text,
  service_categories text[]
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    p.id,
    p.slug::text,
    p.display_name,
    p.headline,
    p.bio,
    p.country_code,
    p.time_zone,
    p.service_categories
  from public.profiles p
  where p.slug = lower(p_slug)::public.citext
    and p.is_public = true
  limit 1;
$$;

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
    e.verification_badge,
    e.published_at
  from public.profiles p
  join public.published_evidence e on e.profile_id = p.id
  where p.slug = lower(p_slug)::public.citext
    and p.is_public = true
    and e.active = true
  order by e.published_at desc;
$$;

revoke all on function public.publish_verified_evidence(uuid) from public;
grant execute on function public.publish_verified_evidence(uuid) to authenticated;

revoke all on function public.get_public_profile(text) from public;
grant execute on function public.get_public_profile(text) to anon, authenticated;

revoke all on function public.list_public_evidence(text) from public;
grant execute on function public.list_public_evidence(text) to anon, authenticated;
