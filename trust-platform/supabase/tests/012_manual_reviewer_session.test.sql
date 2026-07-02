begin;
select plan(5);

select has_function(
  'public',
  'open_manual_reviewer_session',
  array['uuid', 'text', 'text', 'timestamp with time zone'],
  'open_manual_reviewer_session exists'
);

select ok(
  (
    select prosecdef
    from pg_proc
    where oid = 'public.open_manual_reviewer_session(uuid,text,text,timestamp with time zone)'::regprocedure
  ),
  'open_manual_reviewer_session is security definer'
);

select ok(
  position(
    'invitation_token_hash'
    in pg_get_functiondef(
      'public.open_manual_reviewer_session(uuid,text,text,timestamp with time zone)'::regprocedure
    )
  ) > 0,
  'open_manual_reviewer_session validates invitation token hash'
);

select ok(
  position(
    '''review'''
    in pg_get_functiondef(
      'public.open_manual_reviewer_session(uuid,text,text,timestamp with time zone)'::regprocedure
    )
  ) > 0,
  'open_manual_reviewer_session creates a review-scoped session'
);

select is(
  has_function_privilege(
    'anon',
    'public.open_manual_reviewer_session(uuid,text,text,timestamp with time zone)',
    'execute'
  ),
  true,
  'anon can execute token-gated manual reviewer session RPC'
);

select * from finish();
rollback;
