begin;
select plan(9);

select has_function(
  'public',
  'publish_verified_evidence',
  array['uuid'],
  'publish_verified_evidence exists'
);

select ok(
  (
    select prosecdef
    from pg_proc
    where oid = 'public.publish_verified_evidence(uuid)'::regprocedure
  ),
  'publish_verified_evidence is security definer'
);

select ok(
  position(
    'sharing_preference <> ''share_public_profile'''
    in pg_get_functiondef('public.publish_verified_evidence(uuid)'::regprocedure)
  ) > 0,
  'publish_verified_evidence requires company public sharing approval'
);

select ok(
  position(
    'show_company_name'
    in pg_get_functiondef('public.publish_verified_evidence(uuid)'::regprocedure)
  ) > 0,
  'publish_verified_evidence copies only consent-controlled fields'
);

select ok(
  position(
    'set is_public = true'
    in pg_get_functiondef('public.publish_verified_evidence(uuid)'::regprocedure)
  ) > 0,
  'publish_verified_evidence explicitly makes the owner profile public'
);

select ok(
  position(
    'published_evidence.published'
    in pg_get_functiondef('public.publish_verified_evidence(uuid)'::regprocedure)
  ) > 0,
  'publish_verified_evidence appends a sanitized audit event'
);

select has_function(
  'public',
  'get_public_profile',
  array['text'],
  'get_public_profile exists'
);

select has_function(
  'public',
  'list_public_evidence',
  array['text'],
  'list_public_evidence exists'
);

select ok(
  position(
    'p.is_public = true'
    in pg_get_functiondef('public.list_public_evidence(text)'::regprocedure)
  ) > 0,
  'list_public_evidence only returns evidence for public profiles'
);

select * from finish();
rollback;
