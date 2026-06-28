insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'aiko.demo@example.test',
  crypt('local-demo-password', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Aiko Tanaka"}'::jsonb,
  now(),
  now()
)
on conflict (id) do update
set email = excluded.email,
    updated_at = now();

insert into public.profiles (
  id,
  user_id,
  slug,
  display_name,
  headline,
  bio,
  country_code,
  time_zone,
  service_categories,
  is_public
)
values (
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000001',
  'aiko-demo',
  'Aiko Tanaka',
  'AI automation consultant helping operations teams turn manual reporting into reliable internal workflows.',
  'Static local seed data for testing the public proof and structured reference request flow.',
  'JP',
  'Asia/Tokyo',
  array['AI automation', 'Operations'],
  true
)
on conflict (id) do update
set slug = excluded.slug,
    display_name = excluded.display_name,
    headline = excluded.headline,
    bio = excluded.bio,
    country_code = excluded.country_code,
    time_zone = excluded.time_zone,
    service_categories = excluded.service_categories,
    is_public = excluded.is_public,
    updated_at = now();

insert into public.projects (
  id,
  owner_id,
  status,
  published_at
)
values (
  '00000000-0000-4000-8000-000000000201',
  '00000000-0000-4000-8000-000000000001',
  'published',
  now()
)
on conflict (id) do update
set status = excluded.status,
    published_at = excluded.published_at,
    updated_at = now();

insert into public.project_revisions (
  id,
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
  content_hash,
  locked_at
)
values (
  '00000000-0000-4000-8000-000000000301',
  '00000000-0000-4000-8000-000000000201',
  1,
  'professional',
  'Reporting automation for weekly revenue operations',
  'Shared with consent',
  'https://example.test',
  'example.test',
  'upwork',
  null,
  'AI automation',
  '2026-02-01',
  '2026-04-15',
  'Designed and implemented an internal reporting automation workflow.',
  'Automated weekly reporting and reduced manual spreadsheet work across the operations team.',
  'Automated weekly reporting and reduced manual spreadsheet work across the operations team.',
  18,
  'hours/week saved',
  'local-seed-content-hash',
  now()
)
on conflict (id) do update
set title = excluded.title,
    company_name = excluded.company_name,
    service_category = excluded.service_category,
    summary = excluded.summary,
    outcome_statement = excluded.outcome_statement,
    outcome_metric_value = excluded.outcome_metric_value,
    outcome_metric_unit = excluded.outcome_metric_unit;

update public.projects
set current_revision_id = '00000000-0000-4000-8000-000000000301',
    verified_revision_id = '00000000-0000-4000-8000-000000000301',
    updated_at = now()
where id = '00000000-0000-4000-8000-000000000201';

insert into public.published_evidence (
  id,
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
  active
)
values (
  '00000000-0000-4000-8000-000000000501',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000201',
  'Reporting automation for weekly revenue operations',
  'AI automation',
  'Shared with consent',
  'upwork',
  null,
  '2026-02-01',
  '2026-04-15',
  'Automated weekly reporting and reduced manual spreadsheet work across the operations team.',
  18,
  'hours/week saved',
  null,
  null,
  null,
  'yes',
  true,
  'company_domain_verified',
  true
)
on conflict (id) do update
set public_title = excluded.public_title,
    public_service_category = excluded.public_service_category,
    public_company_name = excluded.public_company_name,
    public_acquisition_source = excluded.public_acquisition_source,
    public_project_start = excluded.public_project_start,
    public_project_end = excluded.public_project_end,
    public_outcome_statement = excluded.public_outcome_statement,
    public_outcome_metric_value = excluded.public_outcome_metric_value,
    public_outcome_metric_unit = excluded.public_outcome_metric_unit,
    public_rehire_response = excluded.public_rehire_response,
    public_reference_available = excluded.public_reference_available,
    active = excluded.active,
    published_at = now();
