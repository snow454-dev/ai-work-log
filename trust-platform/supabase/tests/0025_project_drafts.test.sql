begin;
select plan(6);

select has_function(
  'public',
  'create_project_draft',
  array[
    'text',
    'text',
    'text',
    'text',
    'text',
    'public.acquisition_source',
    'text',
    'text',
    'date',
    'date',
    'text',
    'text',
    'text',
    'numeric',
    'text',
    'text'
  ],
  'project draft RPC exists'
);

select ok(
  (
    select prosecdef
    from pg_proc
    where oid = 'public.create_project_draft(text,text,text,text,text,public.acquisition_source,text,text,date,date,text,text,text,numeric,text,text)'::regprocedure
  ),
  'project draft RPC is security definer'
);

select ok(
  (
    select coalesce(array_to_string(proconfig, ','), '') in (
      'search_path=',
      'search_path=""'
    )
    from pg_proc
    where oid = 'public.create_project_draft(text,text,text,text,text,public.acquisition_source,text,text,date,date,text,text,text,numeric,text,text)'::regprocedure
  ),
  'project draft RPC pins an empty search_path'
);

select ok(
  position(
    'v_user_id uuid := auth.uid()'
    in pg_get_functiondef(
      'public.create_project_draft(text,text,text,text,text,public.acquisition_source,text,text,date,date,text,text,text,numeric,text,text)'::regprocedure
    )
  ) > 0,
  'project owner is derived from auth.uid'
);

select ok(
  position(
    'insert into public.audit_events'
    in pg_get_functiondef(
      'public.create_project_draft(text,text,text,text,text,public.acquisition_source,text,text,date,date,text,text,text,numeric,text,text)'::regprocedure
    )
  ) > 0,
  'project draft creation appends an audit event'
);

select ok(
  position(
    'p_owner_id'
    in pg_get_function_arguments(
      'public.create_project_draft(text,text,text,text,text,public.acquisition_source,text,text,date,date,text,text,text,numeric,text,text)'::regprocedure
    )
  ) = 0,
  'project draft RPC does not accept a caller-supplied owner id'
);

select * from finish();
rollback;
