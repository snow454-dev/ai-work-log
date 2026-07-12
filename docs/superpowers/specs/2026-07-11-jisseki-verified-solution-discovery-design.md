# JISSEKI Verified Solution Discovery — Design

Date: 2026-07-11

Status: Approved design

Implementation location: `trust-platform/`

## 1. Executive Summary

Extend JISSEKI from a portable proof profile into a global discovery layer for AI solutions that have already produced client-approved results.

The first release has one buyer flow:

1. A company describes the business task it wants to improve.
2. JISSEKI searches only active, published, company-approved evidence.
3. The company compares outcomes, implementation context, and providers.
4. The company opens a verified solution detail page.
5. If the provider has an approved reference path, the company signs in and submits an implementation inquiry through the existing reference-request workflow.
6. Contracting, payment, delivery, and support continue outside JISSEKI.

The supply side includes independent AI developers, freelancers, small businesses, and product studios. A solution may originate from an Upwork or サンカク engagement, a referral, a direct contract, or the provider's own operational improvement.

The product remains a trust layer rather than becoming a general marketplace. Discovery is global and public; transactional infrastructure is out of scope.

## 2. Product Position

Primary promise:

> Find AI solutions by the business problem they have already solved, then evaluate the company-approved outcome before contacting the provider.

JISSEKI must rank proof before promotional claims. It must not imply that company-domain verification is legal-entity endorsement. It must continue to distinguish:

- Provider-authored claims.
- Facts confirmed by a reviewer controlling a company-domain mailbox.
- Fields explicitly approved for public display.
- A formal endorsement by the client company.

The initial product language remains English and Japanese. Public discovery is global from the first release.

## 3. Goals

### 3.1 Buyer goals

- Start from a business task, not a technology name.
- Compare verified outcomes without contacting reviewers directly.
- Understand who delivered the solution and in what context.
- Contact the provider through a controlled path.

### 3.2 Provider goals

- Turn a verified project into a discoverable commercial asset.
- Be found by companies outside the provider's existing market or country.
- Receive qualified inquiries without exposing the reviewer's contact details.
- Reuse one approved record across a profile, search result, detail page, SEO, and social sharing.

### 3.3 Business goals

- Test whether verified outcomes generate provider inquiries.
- Create a global distribution loop without adding payments or escrow.
- Preserve the original verification and consent model.
- Learn which business-task categories produce repeat demand.

### 3.4 Initial success measures

- Search-to-detail click rate.
- Detail-to-inquiry-start rate.
- Completed inquiry rate.
- Percentage of published evidence receiving at least one qualified inquiry.
- Percentage of searches returning at least one result.
- Provider response rate to accepted or declined inquiries.
- Withdrawal, dispute, abuse, and spam rates.

## 4. Non-Goals

This release will not include:

- Contracts, payments, escrow, invoicing, or delivery management.
- Open buyer-to-provider chat.
- Public star ratings, review averages, or leaderboards.
- Paid placement or sponsored ranking.
- AI-generated case studies or fabricated demo metrics on production pages.
- New reviewer contact exposure.
- A separate solution-listing database disconnected from verified evidence.
- Semantic or vector search infrastructure.
- A native mobile application.

## 5. Information Architecture

### 5.1 Home: `/`

The home page becomes the approved "business-task search" design.

Required sections:

- Global navigation for companies and providers.
- Hero search using a GET form.
- Suggested business-task categories.
- Explanation of company-approved evidence.
- Up to three recent verified outcomes from production data.
- Separate calls to action for companies and providers.
- Japanese and English copy using the current `?lang=` locale convention.

If no published evidence exists, the page shows an honest empty state and beta invitation. It never renders fictional metrics as if they were real.

### 5.2 Search: `/solutions`

Supported query parameters:

- `q`: business task or keyword, maximum 100 trimmed characters.
- `category`: exact public service category, maximum 120 trimmed characters.
- `country`: two-letter provider country code, normalized to uppercase.
- `lang`: `en` or `ja`.
- `page`: positive integer, default `1`.

The first release renders a maximum of 24 records per page and accepts pages `1..100`. Search is server-rendered and usable without client-side JavaScript. A query longer than 100 characters is rejected by the application with a field-level message instead of being silently changed.

Each result card renders the following fields only when the corresponding value exists in the public projection:

- Public title.
- Public service category.
- Provider display name and country.
- Public company name when approved.
- Public outcome metric when approved.
- Company-domain verification badge.
- Reference-path availability.
- Publication date.

### 5.3 Detail: `/solutions/[profileSlug]/[evidenceId]`

The detail page is an SEO-indexable case-study view of one active public evidence record.

It contains:

- Public title and category.
- Provider identity and link to the existing public profile.
- Public company, metric, and dates approved for publication.
- Approved outcome statements, reviewer comments, and rehire responses only after member sign-in, matching the existing public-profile gate.
- A precise explanation of what the verification badge proves.
- A link to the existing inquiry/reference path when `public_reference_available` is true.
- A provider-profile link without an inquiry button when the reference path is unavailable.

Withdrawn, disputed, inactive, private, or unknown evidence returns `404`.

### 5.4 Inquiry

The existing route `/p/[slug]/reference/[evidenceId]` and `reference_requests` workflow remain the backend source of truth.

User-facing copy may describe the action as "implementation inquiry / reference request" or 「導入相談・紹介依頼」. The form continues to explain that:

- The request goes to the provider first.
- Reviewer contact details are not exposed.
- The provider decides whether to route the request further.

Submitting an inquiry requires an authenticated beta account. Public search and detail viewing do not require authentication.

## 6. Data and Search Architecture

### 6.1 Source of truth

Do not create a new marketplace or listing table. `published_evidence` plus the associated public `profiles` projection remain the only discovery source.

This preserves the invariant:

> Nothing can appear in solution discovery unless it is already active, public, and generated from company-approved evidence.

### 6.2 New RPC

Add one security-definer RPC named `search_public_solutions` in migration `202607110012_public_solution_search.sql`.

Inputs:

- `p_query text default null`
- `p_service_category text default null`
- `p_country_code text default null`
- `p_limit integer default 24`
- `p_offset integer default 0`

The function:

- Sets an empty search path.
- Clamps limit to `1..24` and offset to `0..2376`.
- Trims the query and applies `left(..., 100)` as defense in depth after application validation.
- Uses case-folded `strpos` matching, so user input is never interpreted as a SQL wildcard pattern.
- Searches only public title, public service category, provider display name, and provider headline.
- Joins only profiles where `is_public = true`.
- Includes only evidence where `active = true` and `verification_badge = 'company_domain_verified'`.
- Returns only public title, service category, approved company name, approved numeric metric, reference availability, publication metadata, profile slug, provider display name, provider headline, and provider country.
- Never selects reviewer email, provider account email, private project content, tokens, audit events, or unpublished revisions.
- Grants execute to `anon` and `authenticated` only after revoking default privileges.

### 6.3 Ranking

The deterministic beta ranking is:

1. Exact public service-category match.
2. Public title prefix match.
3. Public title contains the query.
4. A public numeric outcome is present.
5. Most recently published.
6. Evidence UUID as a stable final tie-breaker.

There is no paid ranking, star score, hidden manual boost, or popularity leaderboard.

### 6.4 Application boundaries

- `src/domain/public-solution-search.ts` parses and normalizes URL inputs.
- `src/data/public-solutions.ts` is the only application module calling the search RPC.
- Server Components call the data module directly.
- UI components receive parsed public records and never receive raw Supabase rows.
- The browser does not query private tables or hold service-role credentials.

## 7. Components

Create focused components with no data access:

- `solution-search-form.tsx`: GET form and suggested categories.
- `solution-filters.tsx`: category and country links/controls.
- `verified-solution-card.tsx`: consent-safe search result.
- `verified-solution-grid.tsx`: results and empty state.
- `verification-explainer.tsx`: badge limitations and consent explanation.

Reuse:

- `LanguageSwitcher`.
- Legal footers.
- Existing public evidence formatting rules.
- Existing reference-request form and actions.

## 8. SEO and Sharing

- Home and active detail pages are indexable.
- Arbitrary search-query pages use `noindex,follow` to avoid thin and duplicate pages.
- Detail pages use a stable canonical URL without the locale query parameter.
- Detail metadata uses only fields available before member sign-in.
- Detail pages emit conservative `Article` JSON-LD for a verified case-study record, including public title, publication date, provider display name, and a generic verification description.
- Open Graph copy never exposes a hidden company, reviewer, outcome, or metric.
- Japanese and English metadata are generated from the current locale resolver.

## 9. Security and Privacy

The feature is acceptable for private beta because it adds discovery over an existing sanitized public projection instead of opening private project tables.

Required controls:

- Public pages read only through constrained RPCs.
- RLS remains enabled and forced on core tables.
- Search RPC tests prove inactive, private, withdrawn, and non-public evidence is absent.
- Only client-approved fields are selected and rendered.
- Query length, limit, and offset are bounded.
- Search input is treated as data and never interpreted as a wildcard or SQL fragment.
- Inquiry submission retains authentication, validation, consent acknowledgement, owner-only access, and existing abuse controls.
- Reviewer contact details remain inaccessible to buyers.
- Logs and error messages do not contain request content or private row data.

Company-domain verification continues to mean mailbox control, not formal company authorization.

## 10. Error and Empty States

- A query longer than 100 characters is rejected with a field-level message; invalid page, category, or country values fall back to safe defaults with a visible correction message where useful.
- No results shows suggested categories, a shorter-query prompt, and the company beta-intake link.
- RPC failure shows a generic retry state and logs only a sanitized server error.
- Detail lookup for missing or inactive evidence returns `404`.
- An unavailable reference path removes the inquiry button and links to the provider profile.
- Failed inquiry submission preserves existing field validation and generic failure copy.

## 11. Testing

### 11.1 Domain and component tests

- Query trimming, maximum length, page parsing, and locale preservation.
- Result-card omission of null or unapproved fields.
- Empty, loading-independent, and unavailable-reference states.
- Japanese and English copy.

### 11.2 Database tests

- Public active evidence is returned.
- Private profile evidence is excluded.
- Inactive or withdrawn evidence is excluded.
- Search does not return private project summaries, emails, reviewer contact details, or tokens.
- Category, country, query, limit, and offset behave as designed.
- Ranking is deterministic.
- Anonymous callers can execute only the intended public RPC.

### 11.3 Page and release checks

- Typecheck, lint, unit tests, database tests, and production build.
- Smoke checks for Japanese home, English home, empty search, populated search when seed data exists, sign-in redirect, health, and beta-access submission.
- Production smoke target remains `https://jisseki.io`.

## 12. Rollout

1. Ship search and detail pages behind the existing private-beta operating model.
2. Publish only real approved evidence; do not seed fictional production listings.
3. Invite three to five providers with one completed AI project each.
4. Confirm one end-to-end company inquiry before broadening the cohort.
5. Review search terms, zero-result rate, inquiry quality, withdrawals, and abuse weekly.

Stop or narrow the feature if consent disputes, spam, private-data leakage, or misleading verification interpretations appear.

## 13. Deferred Scale Path

When volume justifies it, JISSEKI may add curated industry taxonomies, multilingual indexing, semantic search, saved shortlists, buyer briefs, provider availability, and regional ranking. Those changes must continue to derive public discovery from approved evidence and must not silently convert the product into an unverified listing marketplace.
