begin;
select plan(8);

select has_table('public', 'profiles', 'profiles exists');
select has_table('public', 'published_evidence', 'published evidence exists');
select policies_are(
  'public',
  'projects',
  array['projects_owner_select', 'projects_owner_insert', 'projects_owner_update'],
  'projects has owner-only policies'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.projects'::regclass),
  true,
  'projects has RLS enabled'
);
select is(
  (select relforcerowsecurity from pg_class where oid = 'public.projects'::regclass),
  true,
  'projects has forced RLS'
);
select is(
  has_table_privilege('anon', 'public.verification_requests', 'select'),
  false,
  'anon cannot select verification requests'
);
select is(
  has_table_privilege('authenticated', 'public.verification_requests', 'select'),
  false,
  'authenticated clients cannot select raw verification requests'
);
select is(
  has_table_privilege('authenticated', 'public.verifications', 'select'),
  false,
  'authenticated clients cannot select raw verifications'
);

select * from finish();
rollback;
