begin;
select plan(20);

select has_table(
  'public',
  'app_admin_emails',
  'app_admin_emails table exists'
);

select has_table(
  'public',
  'beta_invite_hashes',
  'beta_invite_hashes table exists'
);

select is_empty(
  $$
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('app_admin_emails', 'beta_invite_hashes')
  $$,
  'admin tables have no direct client policies'
);

select is(
  has_table_privilege('authenticated', 'public.app_admin_emails', 'select'),
  false,
  'authenticated clients cannot read the admin allowlist'
);

select is(
  has_table_privilege('authenticated', 'public.beta_invite_hashes', 'select'),
  false,
  'authenticated clients cannot read invite hashes'
);

select has_function(
  'public',
  'is_current_user_admin',
  array[]::text[],
  'is_current_user_admin exists'
);

select has_function(
  'public',
  'is_beta_invite_hash_active',
  array['text'],
  'is_beta_invite_hash_active exists'
);

select has_function(
  'public',
  'list_admin_beta_access_requests',
  array['text', 'text', 'integer', 'integer'],
  'list admin requests RPC exists'
);

select has_function(
  'public',
  'get_admin_beta_access_request',
  array['uuid'],
  'get admin request RPC exists'
);

select has_function(
  'public',
  'summarize_admin_beta_access_requests',
  array['text'],
  'admin summary RPC exists'
);

select has_function(
  'public',
  'update_admin_beta_access_request_status',
  array['uuid', 'text'],
  'admin status RPC exists'
);

select has_function(
  'public',
  'invite_admin_beta_access_request',
  array['uuid', 'text'],
  'admin invite RPC exists'
);

select ok(
  (
    select prosecdef
    from pg_proc
    where oid = 'public.list_admin_beta_access_requests(text,text,integer,integer)'::regprocedure
  ),
  'admin list RPC is security definer'
);

select ok(
  position(
    'is_current_user_admin'
    in pg_get_functiondef(
      'public.list_admin_beta_access_requests(text,text,integer,integer)'::regprocedure
    )
  ) > 0,
  'admin list RPC enforces database-backed admin authorization'
);

select ok(
  position(
    'for update'
    in lower(pg_get_functiondef(
      'public.invite_admin_beta_access_request(uuid,text)'::regprocedure
    ))
  ) > 0,
  'admin invite locks the request before changing access'
);

select ok(
  position(
    'beta_access_request.invited'
    in pg_get_functiondef(
      'public.invite_admin_beta_access_request(uuid,text)'::regprocedure
    )
  ) > 0,
  'admin invite appends an audit event'
);

select ok(
  position(
    'work_email'
    in pg_get_functiondef(
      'public.invite_admin_beta_access_request(uuid,text)'::regprocedure
    )
  ) > 0,
  'admin invite reads the trusted request email server-side'
);

select is(
  has_function_privilege('anon', 'public.list_admin_beta_access_requests(text,text,integer,integer)', 'execute'),
  false,
  'anon cannot execute the admin list RPC'
);

select is(
  has_function_privilege('anon', 'public.invite_admin_beta_access_request(uuid,text)', 'execute'),
  false,
  'anon cannot execute the admin invite RPC'
);

select is(
  has_function_privilege('anon', 'public.is_beta_invite_hash_active(text)', 'execute'),
  true,
  'anon can check one non-reversible invite hash'
);

select * from finish();
rollback;
