drop function public.summarize_admin_beta_access_requests();

create or replace function public.summarize_admin_beta_access_requests(
  p_intent text default null
)
returns table (
  status text,
  request_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;

  if p_intent is not null and p_intent not in ('developer', 'company') then
    raise exception 'INVALID_BETA_ACCESS_INTENT' using errcode = 'P0001';
  end if;

  return query
  with statuses(status, sort_order) as (
    values
      ('new'::text, 1),
      ('reviewing'::text, 2),
      ('invited'::text, 3),
      ('declined'::text, 4),
      ('closed'::text, 5)
  )
  select
    statuses.status,
    count(request.id) as request_count
  from statuses
  left join public.beta_access_requests as request
    on request.status = statuses.status
    and (p_intent is null or request.intent = p_intent)
  group by statuses.status, statuses.sort_order
  order by statuses.sort_order;
end;
$$;

revoke all on function public.summarize_admin_beta_access_requests(text) from public;
grant execute on function public.summarize_admin_beta_access_requests(text) to authenticated;
