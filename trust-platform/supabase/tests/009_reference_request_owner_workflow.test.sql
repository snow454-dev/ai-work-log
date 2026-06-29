begin;
select plan(8);

select has_index(
  'public',
  'reference_requests',
  'reference_requests_evidence_requester_recent_idx',
  'reference request rate limit has an evidence/email/date index'
);

select has_index(
  'public',
  'reference_requests',
  'reference_requests_profile_requester_recent_idx',
  'reference request profile abuse limit has a profile/email/date index'
);

select has_function(
  'public',
  'update_reference_request_status',
  array['uuid', 'public.reference_request_status'],
  'update_reference_request_status exists'
);

select ok(
  (
    select prosecdef
    from pg_proc
    where oid = 'public.update_reference_request_status(uuid,public.reference_request_status)'::regprocedure
  ),
  'update_reference_request_status is security definer'
);

select ok(
  position(
    'owner_id = (select auth.uid())'
    in pg_get_functiondef(
      'public.update_reference_request_status(uuid,public.reference_request_status)'::regprocedure
    )
  ) > 0,
  'update_reference_request_status requires owner authorization'
);

select ok(
  position(
    'status <> ''pending'''
    in pg_get_functiondef(
      'public.update_reference_request_status(uuid,public.reference_request_status)'::regprocedure
    )
  ) > 0,
  'update_reference_request_status only decides pending requests'
);

select ok(
  position(
    'REFERENCE_REQUEST_RATE_LIMITED'
    in pg_get_functiondef(
      'public.create_reference_request(text,uuid,text,public.citext,text,text,text,text)'::regprocedure
    )
  ) > 0,
  'create_reference_request includes a simple abuse rate limit'
);

select ok(
  position(
    'reference_request.status_updated'
    in pg_get_functiondef(
      'public.update_reference_request_status(uuid,public.reference_request_status)'::regprocedure
    )
  ) > 0,
  'update_reference_request_status appends an audit event'
);

select * from finish();
rollback;
