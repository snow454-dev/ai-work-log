create or replace function public.get_verification_receipt(
  p_verification_id uuid,
  p_receipt_token_hash text
)
returns table (
  id uuid,
  verification_request_id uuid,
  project_title text,
  company_name text,
  service_category text,
  reviewer_email public.citext,
  company_domain_verified boolean,
  consent_status public.consent_status,
  sharing_preference public.sharing_preference,
  open_to_reference_requests boolean,
  submitted_at timestamptz,
  withdrawn_at timestamptz,
  disputed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select
    v.id,
    v.verification_request_id,
    r.title,
    r.company_name,
    r.service_category,
    vr.reviewer_email,
    v.company_domain_verified,
    v.consent_status,
    v.sharing_preference,
    v.open_to_reference_requests,
    v.submitted_at,
    v.withdrawn_at,
    v.disputed_at
  from public.verifications v
  join public.verification_requests vr on vr.id = v.verification_request_id
  join public.project_revisions r on r.id = vr.project_revision_id
  where v.id = p_verification_id
    and v.reviewer_receipt_token_hash = p_receipt_token_hash;
end;
$$;

revoke all on function public.get_verification_receipt(uuid, text) from public;
grant execute on function public.get_verification_receipt(uuid, text)
  to anon, authenticated;
