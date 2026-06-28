begin;
select plan(3);

select has_column(
  'public',
  'verifications',
  'open_to_reference_requests',
  'verifications store reviewer reference-request opt-in separately from public visibility'
);

select has_column(
  'public',
  'published_evidence',
  'public_reference_available',
  'published evidence exposes only reference availability, not reviewer contact details'
);

select ok(
  position(
    'public_reference_available'
    in pg_get_functiondef('public.list_public_evidence(text)'::regprocedure)
  ) > 0,
  'list_public_evidence returns reference availability'
);

select * from finish();
rollback;
