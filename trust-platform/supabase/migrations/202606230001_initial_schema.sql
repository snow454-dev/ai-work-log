create extension if not exists citext;
create extension if not exists pgcrypto;

create type public.project_status as enum (
  'draft', 'sent', 'viewed', 'verified', 'published',
  'withdrawn', 'expired', 'declined', 'disputed'
);
create type public.actor_type as enum ('professional', 'reviewer', 'system', 'admin');
create type public.rehire_response as enum ('yes', 'maybe', 'no');
create type public.consent_status as enum ('active', 'withdrawn', 'disputed');
create type public.acquisition_source as enum (
  'upwork', 'sankaku', 'other_platform', 'referral', 'direct', 'other'
);
create type public.sharing_preference as enum (
  'share_public_profile', 'open_to_reference_request', 'not_now'
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  slug citext not null unique,
  display_name text not null check (char_length(display_name) between 1 and 120),
  headline text not null default '' check (char_length(headline) <= 160),
  bio text not null default '' check (char_length(bio) <= 2000),
  country_code text check (country_code ~ '^[A-Z]{2}$'),
  time_zone text,
  service_categories text[] not null default '{}',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  status public.project_status not null default 'draft',
  current_revision_id uuid,
  verified_revision_id uuid,
  published_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, id)
);

create table public.project_revisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  revision_number integer not null check (revision_number > 0),
  created_by_type public.actor_type not null,
  title text not null check (char_length(title) between 1 and 160),
  company_name text not null check (char_length(company_name) between 1 and 200),
  company_website text,
  company_domain citext not null,
  acquisition_source public.acquisition_source not null,
  source_platform_label text check (
    source_platform_label is null or char_length(source_platform_label) between 1 and 120
  ),
  service_category text not null,
  project_start date,
  project_end date,
  role_description text not null check (char_length(role_description) between 1 and 1000),
  summary text not null check (char_length(summary) between 1 and 2000),
  outcome_statement text not null check (char_length(outcome_statement) between 1 and 1000),
  outcome_metric_value numeric,
  outcome_metric_unit text,
  content_hash text not null,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  unique(project_id, revision_number),
  unique(project_id, id),
  check (project_end is null or project_start is null or project_end >= project_start),
  check (
    (
      acquisition_source = 'other_platform'
      and source_platform_label is not null
      and btrim(source_platform_label) <> ''
    )
    or (
      acquisition_source <> 'other_platform'
      and source_platform_label is null
    )
  )
);

alter table public.projects
  add constraint projects_current_revision_fk
  foreign key (id, current_revision_id) references public.project_revisions(project_id, id);
alter table public.projects
  add constraint projects_verified_revision_fk
  foreign key (id, verified_revision_id) references public.project_revisions(project_id, id);

create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id),
  project_revision_id uuid not null references public.project_revisions(id),
  reviewer_email citext not null,
  reviewer_email_normalized_hash text not null,
  invitation_token_hash text not null unique,
  expires_at timestamptz not null,
  viewed_at timestamptz,
  consumed_at timestamptz,
  revoked_at timestamptz,
  otp_hash text,
  otp_expires_at timestamptz,
  otp_failed_attempts integer not null default 0,
  locked_until timestamptz,
  reminder_count integer not null default 0 check (reminder_count between 0 and 1),
  created_at timestamptz not null default now(),
  unique(project_id, id),
  constraint verification_requests_revision_same_project_fk
    foreign key (project_id, project_revision_id) references public.project_revisions(project_id, id)
);

create table public.reviewer_sessions (
  id uuid primary key default gen_random_uuid(),
  verification_request_id uuid not null references public.verification_requests(id) on delete cascade,
  session_token_hash text not null unique,
  purpose text not null check (purpose in ('review', 'receipt')),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.verifications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id),
  verification_request_id uuid not null unique references public.verification_requests(id),
  approved_revision_id uuid references public.project_revisions(id),
  project_existed boolean not null,
  source_accurate boolean not null,
  role_accurate boolean not null,
  outcome_accurate boolean not null,
  metric_accurate boolean,
  rehire_response public.rehire_response,
  sharing_preference public.sharing_preference not null default 'not_now',
  reviewer_name text,
  reviewer_job_title text,
  reviewer_comment text check (char_length(reviewer_comment) <= 1000),
  show_company_name boolean not null default false,
  show_acquisition_source boolean not null default false,
  show_reviewer_name boolean not null default false,
  show_reviewer_job_title boolean not null default false,
  show_project_period boolean not null default false,
  show_outcome_statement boolean not null default false,
  show_outcome_metric boolean not null default false,
  show_reviewer_comment boolean not null default false,
  show_rehire_response boolean not null default false,
  company_domain_verified boolean not null default false,
  consent_status public.consent_status not null default 'active',
  reviewer_receipt_token_hash text not null unique,
  submitted_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  disputed_at timestamptz,
  constraint verifications_request_same_project_fk
    foreign key (project_id, verification_request_id) references public.verification_requests(project_id, id),
  constraint verifications_approved_revision_same_project_fk
    foreign key (project_id, approved_revision_id) references public.project_revisions(project_id, id)
);

create table public.published_evidence (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null unique references public.projects(id) on delete cascade,
  public_title text not null,
  public_service_category text not null,
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
  verification_badge text not null check (verification_badge = 'company_domain_verified'),
  published_at timestamptz not null default now(),
  active boolean not null default true,
  constraint published_evidence_profile_owner_fk
    foreign key (owner_id, profile_id) references public.profiles(user_id, id) on delete cascade,
  constraint published_evidence_project_owner_fk
    foreign key (owner_id, project_id) references public.projects(owner_id, id) on delete cascade
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_type public.actor_type not null,
  actor_id uuid,
  event_type text not null,
  object_type text not null,
  object_id uuid not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index profiles_user_id_idx on public.profiles(user_id);
create index projects_owner_id_idx on public.projects(owner_id);
create index projects_current_revision_id_idx on public.projects(current_revision_id);
create index projects_verified_revision_id_idx on public.projects(verified_revision_id);
create index project_revisions_project_id_idx on public.project_revisions(project_id);
create index verification_requests_project_id_idx on public.verification_requests(project_id);
create index verification_requests_revision_id_idx on public.verification_requests(project_revision_id);
create index verification_requests_active_token_idx
  on public.verification_requests(invitation_token_hash)
  where consumed_at is null and revoked_at is null;
create index reviewer_sessions_verification_request_id_idx
  on public.reviewer_sessions(verification_request_id);
create index reviewer_sessions_active_token_idx
  on public.reviewer_sessions(session_token_hash)
  where revoked_at is null;
create index verifications_project_id_idx on public.verifications(project_id);
create index verifications_approved_revision_id_idx
  on public.verifications(approved_revision_id);
create index published_evidence_owner_id_idx on public.published_evidence(owner_id);
create index published_evidence_profile_active_idx
  on public.published_evidence(profile_id, published_at desc)
  where active = true;
create index audit_events_object_idx
  on public.audit_events(object_type, object_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_revisions enable row level security;
alter table public.verification_requests enable row level security;
alter table public.reviewer_sessions enable row level security;
alter table public.verifications enable row level security;
alter table public.published_evidence enable row level security;
alter table public.audit_events enable row level security;

alter table public.profiles force row level security;
alter table public.projects force row level security;
alter table public.project_revisions force row level security;
alter table public.verification_requests force row level security;
alter table public.reviewer_sessions force row level security;
alter table public.verifications force row level security;
alter table public.published_evidence force row level security;
alter table public.audit_events force row level security;

create policy profiles_owner_all on public.profiles
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy projects_owner_select on public.projects
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy projects_owner_insert on public.projects
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy projects_owner_update on public.projects
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy project_revisions_owner_select on public.project_revisions
  for select to authenticated using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = (select auth.uid())
    )
  );

create policy verification_requests_owner_select on public.verification_requests
  for select to authenticated using (
    exists (
      select 1
      from public.project_revisions r
      join public.projects p on p.id = r.project_id
      where r.id = project_revision_id and p.owner_id = (select auth.uid())
    )
  );

create policy verifications_owner_select on public.verifications
  for select to authenticated using (
    exists (
      select 1
      from public.verification_requests vr
      join public.project_revisions r on r.id = vr.project_revision_id
      join public.projects p on p.id = r.project_id
      where vr.id = verification_request_id and p.owner_id = (select auth.uid())
    )
  );

create policy published_evidence_public_select on public.published_evidence
  for select to anon, authenticated using (active = true);

revoke all on schema public from public;
grant usage on schema public to anon, authenticated;

revoke all on all tables in schema public from public;
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from public;
revoke all on all sequences in schema public from anon, authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select on public.projects to authenticated;
grant select on public.project_revisions to authenticated;
grant select on public.published_evidence to anon, authenticated;
