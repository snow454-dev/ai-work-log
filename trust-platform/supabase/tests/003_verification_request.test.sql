begin;
select plan(8);

select has_column(
  'public',
  'projects',
  'reviewer_email',
  'projects store the draft reviewer email for later verification sending'
);

select has_index(
  'public',
  'verification_requests',
  'verification_requests_one_active_revision_idx',
  'only one active verification request can exist for a revision'
);

select ok(
  (
    select prosecdef
    from pg_proc
    where oid = 'public.create_verification_request(uuid,text,text,timestamptz)'::regprocedure
  ),
  'create_verification_request is security definer'
);

select ok(
  (
    select coalesce(array_to_string(proconfig, ','), '') in (
      'search_path=',
      'search_path=""'
    )
    from pg_proc
    where oid = 'public.create_verification_request(uuid,text,text,timestamptz)'::regprocedure
  ),
  'create_verification_request pins an empty search_path'
);

select ok(
  position(
    'for update'
    in lower(pg_get_functiondef(
      'public.create_verification_request(uuid,text,text,timestamptz)'::regprocedure
    ))
  ) > 0,
  'create_verification_request locks the project row'
);

select ok(
  position(
    'locked_at = coalesce(locked_at, now())'
    in pg_get_functiondef(
      'public.create_verification_request(uuid,text,text,timestamptz)'::regprocedure
    )
  ) > 0,
  'create_verification_request locks the current revision'
);

select ok(
  position(
    'verification_request.created'
    in pg_get_functiondef(
      'public.create_verification_request(uuid,text,text,timestamptz)'::regprocedure
    )
  ) > 0,
  'create_verification_request appends a sanitized audit event'
);

select ok(
  position(
    'reminder_count = reminder_count + 1'
    in pg_get_functiondef(
      'public.claim_single_reminder(uuid,text,timestamptz)'::regprocedure
    )
  ) > 0,
  'claim_single_reminder atomically claims the one allowed reminder'
);

select * from finish();
rollback;
