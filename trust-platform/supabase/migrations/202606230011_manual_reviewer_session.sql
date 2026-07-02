create or replace function public.open_manual_reviewer_session(
  p_request_id uuid,
  p_invitation_hash text,
  p_session_hash text,
  p_session_expires_at timestamptz
)
returns table (
  session_id uuid,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.verification_requests%rowtype;
  v_session_id uuid;
begin
  select *
  into v_request
  from public.verification_requests
  where verification_requests.id = p_request_id
    and verification_requests.invitation_token_hash = p_invitation_hash
    and verification_requests.consumed_at is null
    and verification_requests.revoked_at is null
    and verification_requests.expires_at > now();

  if not found then
    raise exception 'INVALID_INVITATION' using errcode = 'P0001';
  end if;

  update public.verification_requests
  set viewed_at = coalesce(viewed_at, now())
  where verification_requests.id = v_request.id;

  insert into public.reviewer_sessions (
    verification_request_id,
    session_token_hash,
    purpose,
    expires_at
  )
  values (
    v_request.id,
    p_session_hash,
    'review',
    p_session_expires_at
  )
  returning reviewer_sessions.id into v_session_id;

  return query select v_session_id, p_session_expires_at;
end;
$$;

revoke all on function public.open_manual_reviewer_session(
  uuid,
  text,
  text,
  timestamptz
) from public;
grant execute on function public.open_manual_reviewer_session(
  uuid,
  text,
  text,
  timestamptz
) to anon, authenticated;
