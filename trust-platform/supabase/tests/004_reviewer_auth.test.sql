begin;
select plan(8);

select has_function(
  'public',
  'mark_verification_viewed',
  array['uuid', 'text'],
  'mark_verification_viewed exists'
);

select has_function(
  'public',
  'set_reviewer_otp',
  array['uuid', 'text', 'text', 'timestamp with time zone'],
  'set_reviewer_otp exists'
);

select has_function(
  'public',
  'verify_reviewer_otp',
  array['uuid', 'text', 'text', 'text', 'timestamp with time zone'],
  'verify_reviewer_otp exists'
);

select ok(
  position(
    'viewed_at = coalesce(viewed_at, now())'
    in pg_get_functiondef('public.mark_verification_viewed(uuid,text)'::regprocedure)
  ) > 0,
  'opening a valid invitation marks it viewed'
);

select ok(
  position(
    'locked_until = case'
    in pg_get_functiondef(
      'public.verify_reviewer_otp(uuid,text,text,text,timestamptz)'::regprocedure
    )
  ) > 0,
  'failed OTP attempts can lock the request'
);

select ok(
  position(
    'v_failed_attempts >= 5'
    in pg_get_functiondef(
      'public.verify_reviewer_otp(uuid,text,text,text,timestamptz)'::regprocedure
    )
  ) > 0,
  'five failed OTP attempts trigger lockout'
);

select ok(
  position(
    'session_token_hash'
    in pg_get_functiondef(
      'public.verify_reviewer_otp(uuid,text,text,text,timestamptz)'::regprocedure
    )
  ) > 0,
  'successful OTP stores only a reviewer session token hash'
);

select ok(
  position(
    'otp_hash = null'
    in pg_get_functiondef(
      'public.verify_reviewer_otp(uuid,text,text,text,timestamptz)'::regprocedure
    )
  ) > 0,
  'successful OTP clears OTP material'
);

select * from finish();
rollback;
