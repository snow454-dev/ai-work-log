create index if not exists published_evidence_active_discovery_idx
  on public.published_evidence(published_at desc, id desc)
  where active = true;

create or replace function public.search_public_solutions(
  p_query text default null,
  p_service_category text default null,
  p_country_code text default null,
  p_limit integer default 24,
  p_offset integer default 0
)
returns table (
  evidence_id uuid,
  profile_slug text,
  provider_display_name text,
  provider_headline text,
  provider_country_code text,
  public_title text,
  public_service_category text,
  public_company_name text,
  public_outcome_metric_value numeric,
  public_outcome_metric_unit text,
  public_reference_available boolean,
  verification_badge text,
  published_at timestamptz,
  total_count bigint
)
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_query text := left(btrim(coalesce(p_query, '')), 100);
  v_category text := nullif(left(btrim(coalesce(p_service_category, '')), 120), '');
  v_country text := upper(nullif(left(btrim(coalesce(p_country_code, '')), 2), ''));
  v_limit integer := greatest(1, least(coalesce(p_limit, 24), 24));
  v_offset integer := greatest(0, least(coalesce(p_offset, 0), 2376));
begin
  return query
  with matches as (
    select
      e.id as evidence_id,
      p.slug::text as profile_slug,
      p.display_name as provider_display_name,
      p.headline as provider_headline,
      p.country_code as provider_country_code,
      e.public_title,
      e.public_service_category,
      e.public_company_name,
      e.public_outcome_metric_value,
      e.public_outcome_metric_unit,
      e.public_reference_available,
      e.verification_badge,
      e.published_at,
      case
        when v_query <> ''
          and lower(e.public_service_category) = lower(v_query) then 0
        when v_query <> ''
          and left(lower(e.public_title), char_length(v_query)) = lower(v_query) then 1
        when v_query <> ''
          and strpos(lower(e.public_title), lower(v_query)) > 0 then 2
        else 3
      end as match_rank
    from public.published_evidence e
    join public.profiles p on p.id = e.profile_id
    where p.is_public = true
      and e.active = true
      and e.verification_badge = 'company_domain_verified'
      and (
        v_category is null
        or lower(e.public_service_category) = lower(v_category)
      )
      and (
        v_country is null
        or p.country_code = v_country
      )
      and (
        v_query = ''
        or strpos(
          lower(
            concat_ws(
              ' ',
              e.public_title,
              e.public_service_category,
              p.display_name,
              p.headline
            )
          ),
          lower(v_query)
        ) > 0
      )
  )
  select
    m.evidence_id,
    m.profile_slug,
    m.provider_display_name,
    m.provider_headline,
    m.provider_country_code,
    m.public_title,
    m.public_service_category,
    m.public_company_name,
    m.public_outcome_metric_value,
    m.public_outcome_metric_unit,
    m.public_reference_available,
    m.verification_badge,
    m.published_at,
    count(*) over() as total_count
  from matches m
  order by
    m.match_rank,
    (m.public_outcome_metric_value is not null) desc,
    m.published_at desc,
    m.evidence_id desc
  limit v_limit
  offset v_offset;
end;
$$;

revoke all on function public.search_public_solutions(
  text,
  text,
  text,
  integer,
  integer
) from public;

grant execute on function public.search_public_solutions(
  text,
  text,
  text,
  integer,
  integer
) to anon, authenticated;
