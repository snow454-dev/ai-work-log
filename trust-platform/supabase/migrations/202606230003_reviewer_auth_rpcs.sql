create or replace function public.mark_verification_viewed(
  p_request_id uuid,
  p_invitation_hash text
)
returns table (
  id uuid,
  reviewer_email public.citext,
  professional_name text,
  project_title text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.verification_requests vr
  set viewed_at = coalesce(viewed_at, now())
  where vr.id = p_request_id
    and vr.invitation_token_hash = p_invitation_hash
    and vr.consumed_at is null
    and vr.revoked_at is null
    and vr.expires_at > now();

  if not found then
    raise exception 'INVALID_INVITATION' using errcode = 'P0001';
  end if;

  return query
  select
    vr.id,
    vr.reviewer_email,
    coalesce(profiles.display_name, 'The professional'),
    revisions.title,
    vr.expires_at
  from public.verification_requests vr
  join public.project_revisions revisions on revisions.id = vr.project_revision_id
  join public.projects projects on projects.id = vr.project_id
  left join public.profiles profiles on profiles.user_id = projects.owner_id
  where vr.id = p_request_id;
end;
$$;

create or replace function public.set_reviewer_otp(
  p_request_id uuid,
  p_invitation_hash text,
  p_otp_hash text,
  p_otp_expires_at timestamptz
)
returns table (
  id uuid,
  reviewer_email public.citext,
  professional_name text,
  project_title text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.verification_requests vr
  set otp_hash = p_otp_hash,
      otp_expires_at = p_otp_expires_at,
      otp_failed_attempts = 0,
      locked_until = null,
      viewed_at = coalesce(viewed_at, now())
  where vr.id = p_request_id
    and vr.invitation_token_hash = p_invitation_hash
    and vr.consumed_at is null
    and vr.revoked_at is null
    and vr.expires_at > now();

  if not found then
    raise exception 'INVALID_INVITATION' using errcode = 'P0001';
  end if;

  return query
  select
    vr.id,
    vr.reviewer_email,
    coalesce(profiles.display_name, 'The professional'),
    revisions.title,
    p_otp_expires_at
  from public.verification_requests vr
  join public.project_revisions revisions on revisions.id = vr.project_revision_id
  join public.projects projects on projects.id = vr.project_id
  left join public.profiles profiles on profiles.user_id = projects.owner_id
  where vr.id = p_request_id;
end;
$$;

create or replace function public.verify_reviewer_otp(
  p_request_id uuid,
  p_invitation_hash text,
  p_submitted_otp_hash text,
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
  v_failed_attempts integer;
  v_session_id uuid;
begin
  select *
  into v_request
  from public.verification_requests
  where verification_requests.id = p_request_id
    and verification_requests.invitation_token_hash = p_invitation_hash
    and verification_requests.consumed_at is null
    and verification_requests.revoked_at is null
    and verification_requests.expires_at > now()
  for update;

  if not found then
    raise exception 'INVALID_INVITATION' using errcode = 'P0001';
  end if;

  if v_request.locked_until is not null and v_request.locked_until > now() then
    raise exception 'OTP_LOCKED' using errcode = 'P0001';
  end if;

  if v_request.otp_hash is null
    or v_request.otp_expires_at is null
    or v_request.otp_expires_at <= now()
  then
    raise exception 'OTP_EXPIRED' using errcode = 'P0001';
  end if;

  if v_request.otp_hash <> p_submitted_otp_hash then
    v_failed_attempts := v_request.otp_failed_attempts + 1;

    update public.verification_requests
    set otp_failed_attempts = v_failed_attempts,
        locked_until = case
          when v_failed_attempts >= 5 then now() + interval '30 minutes'
          else locked_until
        end
    where verification_requests.id = p_request_id;

    raise exception 'INVALID_OTP' using errcode = 'P0001';
  end if;

  insert into public.reviewer_sessions (
    verification_request_id,
    session_token_hash,
    purpose,
    expires_at
  )
  values (
    p_request_id,
    p_session_hash,
    'review',
    p_session_expires_at
  )
  returning reviewer_sessions.id into v_session_id;

  update public.verification_requests
  set otp_hash = null,
      otp_expires_at = null,
      otp_failed_attempts = 0,
      locked_until = null,
      consumed_at = now()
  where verification_requests.id = p_request_id;

  insert into public.audit_events (
    actor_type,
    event_type,
    object_type,
    object_id,
    metadata
  )
  values (
    'reviewer',
    'reviewer_session.created',
    'reviewer_session',
    v_session_id,
    jsonb_build_object('verification_request_id', p_request_id)
  );

  return query
  select v_session_id, p_session_expires_at;
end;
$$;

revoke all on function public.mark_verification_viewed(uuid, text) from public;
grant execute on function public.mark_verification_viewed(uuid, text)
  to anon, authenticated;

revoke all on function public.set_reviewer_otp(uuid, text, text, timestamptz)
  from public;
grant execute on function public.set_reviewer_otp(uuid, text, text, timestamptz)
  to anon, authenticated;

revoke all on function public.verify_reviewer_otp(uuid, text, text, text, timestamptz)
  from public;
grant execute on function public.verify_reviewer_otp(uuid, text, text, text, timestamptz)
  to anon, authenticated;
