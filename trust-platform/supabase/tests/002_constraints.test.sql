begin;
select plan(8);

select col_is_pk('public', 'projects', 'id', 'projects id is primary key');
select col_is_unique(
  'public',
  'verifications',
  'verification_request_id',
  'only one verification per request'
);
select has_index('public', 'projects', 'projects_owner_id_idx', 'owner RLS index exists');
select has_index(
  'public',
  'verification_requests',
  'verification_requests_active_token_idx',
  'active token lookup index exists'
);
select is(
  (
    select array_length(conkey, 1)
    from pg_constraint
    where conname = 'projects_current_revision_fk'
  ),
  2,
  'current revision foreign key is scoped to project'
);
select is(
  (
    select array_length(conkey, 1)
    from pg_constraint
    where conname = 'projects_verified_revision_fk'
  ),
  2,
  'verified revision foreign key is scoped to project'
);
select is(
  (
    select array_length(conkey, 1)
    from pg_constraint
    where conname = 'published_evidence_project_owner_fk'
  ),
  2,
  'published evidence project foreign key is scoped to owner'
);
select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.project_revisions'::regclass
      and contype = 'c'
      and position('acquisition_source = ''other_platform''' in lower(pg_get_constraintdef(oid))) > 0
      and position('source_platform_label is not null' in lower(pg_get_constraintdef(oid))) > 0
      and position('btrim(source_platform_label)' in lower(pg_get_constraintdef(oid))) > 0
      and position('acquisition_source <> ''other_platform''' in lower(pg_get_constraintdef(oid))) > 0
      and position('source_platform_label is null' in lower(pg_get_constraintdef(oid))) > 0
  ),
  'source platform label is required only for other external platforms'
);

select * from finish();
rollback;
