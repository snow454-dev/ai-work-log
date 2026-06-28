begin;
select plan(8);

select has_table(
  'public',
  'reference_requests',
  'reference_requests table exists'
);

select has_column(
  'public',
  'reference_requests',
  'requester_email',
  'reference_requests store requester email for professional follow-up'
);

select policies_are(
  'public',
  'reference_requests',
  array['reference_requests_owner_select'],
  'reference_requests only expose rows through the owner select policy'
);

select has_function(
  'public',
  'create_reference_request',
  array['text', 'uuid', 'text', 'public.citext', 'text', 'text', 'text', 'text'],
  'create_reference_request exists'
);

select ok(
  (
    select prosecdef
    from pg_proc
    where oid = 'public.create_reference_request(text,uuid,text,public.citext,text,text,text,text)'::regprocedure
  ),
  'create_reference_request is security definer'
);

select ok(
  position(
    'public_reference_available = true'
    in pg_get_functiondef(
      'public.create_reference_request(text,uuid,text,public.citext,text,text,text,text)'::regprocedure
    )
  ) > 0,
  'create_reference_request requires reference availability'
);

select ok(
  position(
    'reference_request.created'
    in pg_get_functiondef(
      'public.create_reference_request(text,uuid,text,public.citext,text,text,text,text)'::regprocedure
    )
  ) > 0,
  'create_reference_request appends a sanitized audit event'
);

select has_function(
  'public',
  'list_reference_requests_for_owner',
  array[]::text[],
  'list_reference_requests_for_owner exists'
);

select * from finish();
rollback;
