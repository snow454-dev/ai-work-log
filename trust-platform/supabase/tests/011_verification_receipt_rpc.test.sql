begin;
select plan(5);

select has_function(
  'public',
  'get_verification_receipt',
  array['uuid', 'text'],
  'get_verification_receipt exists'
);

select ok(
  (
    select prosecdef
    from pg_proc
    where oid = 'public.get_verification_receipt(uuid,text)'::regprocedure
  ),
  'get_verification_receipt is security definer'
);

select ok(
  position(
    'reviewer_receipt_token_hash'
    in pg_get_functiondef('public.get_verification_receipt(uuid,text)'::regprocedure)
  ) > 0,
  'get_verification_receipt validates receipt token hash'
);

select ok(
  position(
    'reviewer_email'
    in pg_get_functiondef('public.get_verification_receipt(uuid,text)'::regprocedure)
  ) > 0,
  'get_verification_receipt returns reviewer email only through token-gated receipt'
);

select is(
  has_function_privilege(
    'anon',
    'public.get_verification_receipt(uuid,text)',
    'execute'
  ),
  true,
  'anon can execute token-gated receipt RPC'
);

select * from finish();
rollback;
