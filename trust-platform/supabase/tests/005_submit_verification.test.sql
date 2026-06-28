begin;
select plan(8);

select has_function(
  'public',
  'submit_verification',
  array[
    'uuid',
    'text',
    'boolean',
    'boolean',
    'boolean',
    'boolean',
    'boolean',
    'public.rehire_response',
    'public.sharing_preference',
    'boolean',
    'text',
    'text',
    'text',
    'boolean',
    'boolean',
    'boolean',
    'boolean',
    'boolean',
    'boolean',
    'boolean',
    'boolean',
    'boolean',
    'text'
  ],
  'submit_verification exists'
);

select ok(
  (
    select prosecdef
    from pg_proc
    where oid = 'public.submit_verification(uuid,text,boolean,boolean,boolean,boolean,boolean,public.rehire_response,public.sharing_preference,boolean,text,text,text,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,text)'::regprocedure
  ),
  'submit_verification is security definer'
);

select ok(
  position(
    'session_token_hash'
    in pg_get_functiondef(
      'public.submit_verification(uuid,text,boolean,boolean,boolean,boolean,boolean,public.rehire_response,public.sharing_preference,boolean,text,text,text,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,text)'::regprocedure
    )
  ) > 0,
  'submit_verification validates reviewer session hash'
);

select ok(
  position(
    'insert into public.verifications'
    in pg_get_functiondef(
      'public.submit_verification(uuid,text,boolean,boolean,boolean,boolean,boolean,public.rehire_response,public.sharing_preference,boolean,text,text,text,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,text)'::regprocedure
    )
  ) > 0,
  'submit_verification inserts verification'
);

select ok(
  position(
    'open_to_reference_requests'
    in pg_get_functiondef(
      'public.submit_verification(uuid,text,boolean,boolean,boolean,boolean,boolean,public.rehire_response,public.sharing_preference,boolean,text,text,text,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,text)'::regprocedure
    )
  ) > 0,
  'submit_verification stores structured reference availability'
);

select ok(
  position(
    'set revoked_at = now()'
    in pg_get_functiondef(
      'public.submit_verification(uuid,text,boolean,boolean,boolean,boolean,boolean,public.rehire_response,public.sharing_preference,boolean,text,text,text,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,text)'::regprocedure
    )
  ) > 0,
  'submit_verification revokes reviewer sessions'
);

select ok(
  position(
    'verified_revision_id'
    in pg_get_functiondef(
      'public.submit_verification(uuid,text,boolean,boolean,boolean,boolean,boolean,public.rehire_response,public.sharing_preference,boolean,text,text,text,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,text)'::regprocedure
    )
  ) > 0,
  'submit_verification records the verified revision when approved'
);

select ok(
  position(
    'verification.submitted'
    in pg_get_functiondef(
      'public.submit_verification(uuid,text,boolean,boolean,boolean,boolean,boolean,public.rehire_response,public.sharing_preference,boolean,text,text,text,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,boolean,text)'::regprocedure
    )
  ) > 0,
  'submit_verification appends a sanitized audit event'
);

select * from finish();
rollback;
