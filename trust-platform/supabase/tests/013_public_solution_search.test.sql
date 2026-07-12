begin;
select plan(11);

select has_function(
  'public',
  'search_public_solutions',
  array['text', 'text', 'text', 'integer', 'integer'],
  'search_public_solutions exists'
);

select ok(
  (
    select prosecdef
    from pg_proc
    where oid = 'public.search_public_solutions(text,text,text,integer,integer)'::regprocedure
  ),
  'search_public_solutions is security definer'
);

select ok(
  (
    select exists (
      select 1
      from unnest(coalesce(proconfig, array[]::text[])) as setting
      where setting like 'search_path=%'
    )
    from pg_proc
    where oid = 'public.search_public_solutions(text,text,text,integer,integer)'::regprocedure
  ),
  'search_public_solutions pins an empty search path'
);

select ok(
  position(
    'p.is_public = true'
    in pg_get_functiondef(
      'public.search_public_solutions(text,text,text,integer,integer)'::regprocedure
    )
  ) > 0,
  'search only includes public profiles'
);

select ok(
  position(
    'e.active = true'
    in pg_get_functiondef(
      'public.search_public_solutions(text,text,text,integer,integer)'::regprocedure
    )
  ) > 0,
  'search only includes active evidence'
);

select ok(
  position(
    'company_domain_verified'
    in pg_get_functiondef(
      'public.search_public_solutions(text,text,text,integer,integer)'::regprocedure
    )
  ) > 0,
  'search only includes company-domain verified evidence'
);

select ok(
  position(
    'reviewer_email'
    in pg_get_functiondef(
      'public.search_public_solutions(text,text,text,integer,integer)'::regprocedure
    )
  ) = 0,
  'search never selects reviewer email'
);

select ok(
  position(
    'outcome_statement'
    in pg_get_functiondef(
      'public.search_public_solutions(text,text,text,integer,integer)'::regprocedure
    )
  ) = 0,
  'search does not expose member-only outcome statements'
);

select ok(
  position(
    'project_revisions'
    in pg_get_functiondef(
      'public.search_public_solutions(text,text,text,integer,integer)'::regprocedure
    )
  ) = 0,
  'search never reads private project revisions'
);

select is(
  has_function_privilege(
    'anon',
    'public.search_public_solutions(text,text,text,integer,integer)',
    'execute'
  ),
  true,
  'anonymous visitors can execute the sanitized search RPC'
);

select has_index(
  'public',
  'published_evidence',
  'published_evidence_active_discovery_idx',
  'active public evidence has a bounded discovery index'
);

select * from finish();
rollback;
