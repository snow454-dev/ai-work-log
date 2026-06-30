begin;
select plan(8);

select has_table(
  'public',
  'beta_access_requests',
  'beta_access_requests table exists'
);

select has_column(
  'public',
  'beta_access_requests',
  'work_email',
  'beta_access_requests store requester work email for beta follow-up'
);

select is_empty(
  $$
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'beta_access_requests'
  $$,
  'beta_access_requests has no direct client policies'
);

select is(
  has_table_privilege('anon', 'public.beta_access_requests', 'select'),
  false,
  'anon cannot select beta access requests'
);

select is(
  has_table_privilege('authenticated', 'public.beta_access_requests', 'select'),
  false,
  'authenticated clients cannot select beta access requests'
);

select has_function(
  'public',
  'create_beta_access_request',
  array['text', 'text', 'public.citext', 'text', 'text', 'text', 'text'],
  'create_beta_access_request exists'
);

select ok(
  (
    select prosecdef
    from pg_proc
    where oid = 'public.create_beta_access_request(text,text,public.citext,text,text,text,text)'::regprocedure
  ),
  'create_beta_access_request is security definer'
);

select ok(
  position(
    'beta_access_request.created'
    in pg_get_functiondef(
      'public.create_beta_access_request(text,text,public.citext,text,text,text,text)'::regprocedure
    )
  ) > 0,
  'create_beta_access_request appends a sanitized audit event'
);

select * from finish();
rollback;
