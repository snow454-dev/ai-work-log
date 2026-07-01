create or replace function public.create_project_draft(
  p_title text,
  p_company_name text,
  p_company_website text,
  p_company_domain text,
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

  insert into public.projects (owner_id)
  values (v_user_id)
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

revoke all on function public.create_project_draft(
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
