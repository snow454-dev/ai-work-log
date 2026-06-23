# Verified Reputation Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AI自動化・AIコンサルタントが案件を登録し、取引企業がリンク＋メールOTPで検証し、承認済み項目だけを公開プロフィールへ掲載できる独立MVPを `trust-platform/` に構築する。

**Architecture:** Next.js 16 App Routerを独立アプリとして作り、Supabase Auth/Postgresを専用プロジェクトとして分離する。認証済みユーザーの更新はServer Actions、企業レビュー・撤回・異議申立ては期限付き能力トークンとOTPを検証するRoute Handler/Server Actionで処理し、公開ページは非公開テーブルから直接描画せず、承認済みフィールドだけを持つ公開プロジェクションから生成する。

**Tech Stack:** Next.js 16.2.2、React 19、TypeScript、Tailwind CSS、Supabase Auth/Postgres/RLS、Zod、Resend、Nodemailer/Mailpit、Vitest、Testing Library、pgTAP、Playwright

---

## 実行前の前提

- 実装開始時に `superpowers:using-git-worktrees` で分離worktreeを作る。
- 既存のルートアプリ `ai-work-log`、未コミットの `AGENTS.md`、`.lazyweb/`、`.superpowers/` は変更・削除・ステージしない。
- Next.jsコードを書く直前に、親リポジトリの `node_modules/next/dist/docs/` から該当ガイドを再確認する。
- UI実装タスクでは `frontend-design`、`baseline-ui`、`fixing-accessibility`、Reactコードでは `vercel-react-best-practices` を実行側で読む。
- DB実装では `supabase-postgres-best-practices` を実行側で読む。
- Docker DesktopまたはDocker互換ランタイムを起動しておく。

## 完成時の主要ファイル構成

```text
trust-platform/
├── .env.example
├── README.md
├── package.json
├── playwright.config.ts
├── vitest.config.ts
├── src/
│   ├── app/
│   │   ├── (auth)/sign-in/page.tsx
│   │   ├── (app)/dashboard/page.tsx
│   │   ├── (app)/onboarding/page.tsx
│   │   ├── (app)/projects/new/page.tsx
│   │   ├── (app)/projects/[projectId]/page.tsx
│   │   ├── auth/confirm/route.ts
│   │   ├── verify/[requestId]/page.tsx
│   │   ├── verify/[requestId]/review/page.tsx
│   │   ├── verification-receipt/[verificationId]/page.tsx
│   │   ├── p/[slug]/page.tsx
│   │   ├── legal/privacy/page.tsx
│   │   ├── legal/terms/page.tsx
│   │   ├── legal/verification-policy/page.tsx
│   │   ├── actions/
│   │   └── api/
│   ├── components/
│   ├── data/
│   ├── domain/
│   ├── lib/
│   │   ├── email/
│   │   ├── security/
│   │   └── supabase/
│   └── proxy.ts
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   └── tests/
└── tests/e2e/
```

## Task 1: 独立Next.jsアプリとテスト基盤を作る

**Files:**
- Create: `trust-platform/`
- Create: `trust-platform/.env.example`
- Create: `trust-platform/vitest.config.ts`
- Create: `trust-platform/src/test/setup.ts`
- Create: `trust-platform/src/test/server-only.ts`
- Create: `trust-platform/src/lib/env-schema.ts`
- Create: `trust-platform/src/lib/env.ts`
- Test: `trust-platform/src/lib/env-schema.test.ts`
- Modify: `trust-platform/package.json`

- [ ] **Step 1: Next.js 16.2.2で独立アプリを生成する**

Run:

```bash
npx create-next-app@16.2.2 trust-platform \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-npm \
  --yes
```

Expected: `trust-platform/package.json` が生成され、`next` が `16.2.2` 系になる。

- [ ] **Step 2: 実行・テスト依存関係を追加する**

Run:

```bash
cd trust-platform
npm install @supabase/supabase-js @supabase/ssr zod resend nodemailer server-only
npm install -D supabase vitest jsdom @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @types/nodemailer @playwright/test
npx playwright install chromium
```

Expected: すべてのパッケージが正常に追加される。

- [ ] **Step 3: テストスクリプトを追加する**

`trust-platform/package.json` の `scripts` を次にする。

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:start": "supabase start",
    "db:stop": "supabase stop",
    "db:reset": "supabase db reset",
    "db:test": "supabase test db"
  }
}
```

- [ ] **Step 4: 環境変数検証の失敗テストを書く**

Create `trust-platform/src/lib/env-schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./env-schema";

describe("parseServerEnv", () => {
  it("rejects missing server secrets", () => {
    expect(() =>
      parseServerEnv({
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      }),
    ).toThrow("SUPABASE_SECRET_KEY");
  });

  it("accepts a complete local configuration", () => {
    expect(
      parseServerEnv({
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
        SUPABASE_SECRET_KEY: "sb_secret_test",
        APP_URL: "http://localhost:3000",
        TOKEN_PEPPER: "0123456789abcdef0123456789abcdef",
        OTP_PEPPER: "abcdef0123456789abcdef0123456789",
        MAIL_TRANSPORT: "smtp",
        SMTP_HOST: "127.0.0.1",
        SMTP_PORT: "54325",
        MAIL_FROM: "Trust Platform <no-reply@example.test>",
      }),
    ).toMatchObject({ MAIL_TRANSPORT: "smtp", SMTP_PORT: 54325 });
  });
});
```

- [ ] **Step 5: テストを実行して失敗を確認する**

Run:

```bash
npm test -- src/lib/env-schema.test.ts
```

Expected: FAIL with `Cannot find module './env-schema'`.

- [ ] **Step 6: 環境変数スキーマを実装する**

Create `trust-platform/src/lib/env-schema.ts`:

```ts
import { z } from "zod";

const serverEnvSchema = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    SUPABASE_SECRET_KEY: z.string().min(1),
    APP_URL: z.url(),
    TOKEN_PEPPER: z.string().min(32),
    OTP_PEPPER: z.string().min(32),
    MAIL_TRANSPORT: z.enum(["smtp", "resend"]),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().optional(),
    RESEND_API_KEY: z.string().optional(),
    MAIL_FROM: z.string().min(1),
  })
  .superRefine((value, ctx) => {
    if (value.MAIL_TRANSPORT === "smtp" && (!value.SMTP_HOST || !value.SMTP_PORT)) {
      ctx.addIssue({
        code: "custom",
        path: ["SMTP_HOST"],
        message: "SMTP_HOST and SMTP_PORT are required for smtp transport",
      });
    }
    if (value.MAIL_TRANSPORT === "resend" && !value.RESEND_API_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["RESEND_API_KEY"],
        message: "RESEND_API_KEY is required for resend transport",
      });
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(input: NodeJS.ProcessEnv | Record<string, string | undefined>) {
  return serverEnvSchema.parse(input);
}
```

Create `trust-platform/src/lib/env.ts`:

```ts
import "server-only";
import { parseServerEnv } from "./env-schema";
export const env = parseServerEnv(process.env);
```

Create `trust-platform/.env.example`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=replace-with-local-publishable-key
SUPABASE_SECRET_KEY=replace-with-local-secret-key
APP_URL=http://localhost:3000
TOKEN_PEPPER=replace-with-at-least-32-random-characters
OTP_PEPPER=replace-with-at-least-32-random-characters
MAIL_TRANSPORT=smtp
SMTP_HOST=127.0.0.1
SMTP_PORT=54325
MAIL_FROM=Trust Platform <no-reply@example.test>
RESEND_API_KEY=
```

- [ ] **Step 7: Vitestを設定してテストを通す**

Create `trust-platform/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./src/test/server-only.ts"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    clearMocks: true,
  },
});
```

Create `trust-platform/src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";

process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://127.0.0.1:54321";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??= "sb_publishable_test";
process.env.SUPABASE_SECRET_KEY ??= "sb_secret_test";
process.env.APP_URL ??= "http://localhost:3000";
process.env.TOKEN_PEPPER ??= "0123456789abcdef0123456789abcdef";
process.env.OTP_PEPPER ??= "abcdef0123456789abcdef0123456789";
process.env.MAIL_TRANSPORT ??= "smtp";
process.env.SMTP_HOST ??= "127.0.0.1";
process.env.SMTP_PORT ??= "54325";
process.env.MAIL_FROM ??= "Trust Platform <no-reply@example.test>";
```

Create `trust-platform/src/test/server-only.ts`:

```ts
export {};
```

Run:

```bash
npm test -- src/lib/env-schema.test.ts
npm run lint
npm run typecheck
```

Expected: all PASS.

- [ ] **Step 8: コミットする**

```bash
git add trust-platform
git commit -m "chore: scaffold trust platform app"
```

## Task 2: Supabaseローカル環境・SSRクライアント・個人認証を作る

**Files:**
- Create: `trust-platform/supabase/config.toml`
- Create: `trust-platform/src/lib/supabase/client.ts`
- Create: `trust-platform/src/lib/supabase/server.ts`
- Create: `trust-platform/src/lib/supabase/admin.ts`
- Create: `trust-platform/src/lib/supabase/proxy.ts`
- Create: `trust-platform/src/proxy.ts`
- Create: `trust-platform/src/data/auth.ts`
- Create: `trust-platform/src/app/(auth)/sign-in/page.tsx`
- Create: `trust-platform/src/app/actions/auth.ts`
- Create: `trust-platform/src/app/auth/confirm/route.ts`
- Create: `trust-platform/supabase/templates/magic_link.html`
- Test: `trust-platform/src/data/auth.test.ts`

- [ ] **Step 1: Supabaseローカル設定を初期化する**

Run:

```bash
cd trust-platform
npx supabase init
npx supabase start
```

Expected: API `http://127.0.0.1:54321`、Studio `http://127.0.0.1:54323`、Mailpit `http://127.0.0.1:54324` が表示される。

- [ ] **Step 2: 認証ガードの失敗テストを書く**

Create `trust-platform/src/data/auth.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { requireUserId } from "./auth";

describe("requireUserId", () => {
  it("throws when claims do not contain a subject", async () => {
    const getClaims = vi.fn().mockResolvedValue({ data: { claims: null }, error: null });
    await expect(requireUserId({ auth: { getClaims } } as never)).rejects.toThrow(
      "UNAUTHENTICATED",
    );
  });

  it("returns the validated subject", async () => {
    const getClaims = vi
      .fn()
      .mockResolvedValue({ data: { claims: { sub: "user-123" } }, error: null });
    await expect(requireUserId({ auth: { getClaims } } as never)).resolves.toBe("user-123");
  });
});
```

- [ ] **Step 3: 失敗を確認する**

Run:

```bash
npm test -- src/data/auth.test.ts
```

Expected: FAIL because `src/data/auth.ts` does not exist.

- [ ] **Step 4: Supabaseクライアントを実装する**

Create `trust-platform/src/lib/supabase/client.ts`:

```ts
"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
```

Create `trust-platform/src/lib/supabase/server.ts`:

```ts
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (values) => {
          try {
            values.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components cannot write cookies. Proxy refreshes sessions.
          }
        },
      },
    },
  );
}
```

Create `trust-platform/src/lib/supabase/admin.ts`:

```ts
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export function createAdminClient() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
```

Create `trust-platform/src/data/auth.ts`:

```ts
import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

type ClaimsClient = {
  auth: {
    getClaims(): Promise<{
      data: { claims: { sub?: string } | null };
      error: unknown;
    }>;
  };
};

export async function requireUserId(client: ClaimsClient): Promise<string> {
  const { data, error } = await client.auth.getClaims();
  const subject = data.claims?.sub;
  if (error || !subject) throw new Error("UNAUTHENTICATED");
  return subject;
}

export const getCurrentUserId = cache(async () => requireUserId(await createClient()));
```

- [ ] **Step 5: Proxyを実装する**

Create `trust-platform/src/lib/supabase/proxy.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values) => {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  await supabase.auth.getClaims();
  return response;
}
```

Create `trust-platform/src/proxy.ts`:

```ts
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

- [ ] **Step 6: Magic-link認証画面とコールバックを実装する**

Create `trust-platform/src/app/actions/auth.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ email: z.email().trim().toLowerCase() });

export async function signIn(_: { error?: string; sent?: boolean }, formData: FormData) {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: "Enter a valid email address." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${env.APP_URL}/auth/confirm`,
      shouldCreateUser: true,
    },
  });
  if (error) return { error: "Unable to send the sign-in email." };
  return { sent: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
```

Create `trust-platform/src/app/auth/confirm/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  if (!tokenHash) return NextResponse.redirect(new URL("/sign-in?error=invalid", request.url));

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
  return NextResponse.redirect(
    new URL(error ? "/sign-in?error=invalid" : "/dashboard", request.url),
  );
}
```

Create `trust-platform/src/app/(auth)/sign-in/page.tsx` with a client form using `useActionState(signIn, {})`, an email field, submit button, sent state, and no password field.

Create `trust-platform/supabase/templates/magic_link.html`:

```html
<h2>Sign in to Verified Work</h2>
<p>Use this secure link to continue:</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">
    Sign in
  </a>
</p>
<p>If you did not request this email, you can ignore it.</p>
```

Reference this file from `supabase/config.toml` so local and production template content remain reviewable in source control.

- [ ] **Step 7: テストとビルドを通す**

Run:

```bash
npm test -- src/data/auth.test.ts
npm run lint
npm run typecheck
npm run build
```

Expected: all PASS.

- [ ] **Step 8: コミットする**

```bash
git add trust-platform
git commit -m "feat: add passwordless authentication foundation"
```

## Task 3: DBスキーマ・制約・RLS・公開プロジェクションを作る

**Files:**
- Create: `trust-platform/supabase/migrations/202606230001_initial_schema.sql`
- Create: `trust-platform/supabase/tests/001_rls.test.sql`
- Create: `trust-platform/supabase/tests/002_constraints.test.sql`

- [ ] **Step 1: 先にRLSテストを書く**

Create `trust-platform/supabase/tests/001_rls.test.sql`:

```sql
begin;
select plan(5);

select has_table('public', 'profiles', 'profiles exists');
select has_table('public', 'published_evidence', 'published evidence exists');
select policies_are(
  'public',
  'projects',
  array['projects_owner_select', 'projects_owner_insert', 'projects_owner_update'],
  'projects has owner-only policies'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.projects'::regclass),
  true,
  'projects has RLS enabled'
);
select is(
  has_table_privilege('anon', 'public.verification_requests', 'select'),
  false,
  'anon cannot select verification requests'
);

select * from finish();
rollback;
```

Create `trust-platform/supabase/tests/002_constraints.test.sql`:

```sql
begin;
select plan(4);

select col_is_pk('public', 'projects', 'id', 'projects id is primary key');
select col_is_unique(
  'public',
  'verifications',
  'verification_request_id',
  'only one verification per request'
);
select has_index('public', 'projects', 'projects_owner_id_idx', 'owner RLS index exists');
select has_index(
  'public',
  'verification_requests',
  'verification_requests_active_token_idx',
  'active token lookup index exists'
);

select * from finish();
rollback;
```

- [ ] **Step 2: DBテストの失敗を確認する**

Run:

```bash
npm run db:test
```

Expected: FAIL because tables and policies do not exist.

- [ ] **Step 3: 初期スキーマを実装する**

Create `trust-platform/supabase/migrations/202606230001_initial_schema.sql` containing:

```sql
create extension if not exists citext;
create extension if not exists pgcrypto;

create type public.project_status as enum (
  'draft', 'sent', 'viewed', 'verified', 'published',
  'withdrawn', 'expired', 'declined', 'disputed'
);
create type public.actor_type as enum ('professional', 'reviewer', 'system', 'admin');
create type public.rehire_response as enum ('yes', 'maybe', 'no');
create type public.consent_status as enum ('active', 'withdrawn', 'disputed');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  slug citext not null unique,
  display_name text not null check (char_length(display_name) between 1 and 120),
  headline text not null default '' check (char_length(headline) <= 160),
  bio text not null default '' check (char_length(bio) <= 2000),
  country_code text check (country_code ~ '^[A-Z]{2}$'),
  time_zone text,
  service_categories text[] not null default '{}',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  status public.project_status not null default 'draft',
  current_revision_id uuid,
  verified_revision_id uuid,
  published_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_revisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  revision_number integer not null check (revision_number > 0),
  created_by_type public.actor_type not null,
  title text not null check (char_length(title) between 1 and 160),
  company_name text not null check (char_length(company_name) between 1 and 200),
  company_website text,
  company_domain citext not null,
  service_category text not null,
  project_start date,
  project_end date,
  role_description text not null check (char_length(role_description) between 1 and 1000),
  summary text not null check (char_length(summary) between 1 and 2000),
  outcome_statement text not null check (char_length(outcome_statement) between 1 and 1000),
  outcome_metric_value numeric,
  outcome_metric_unit text,
  content_hash text not null,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  unique(project_id, revision_number),
  check (project_end is null or project_start is null or project_end >= project_start)
);

alter table public.projects
  add constraint projects_current_revision_fk
  foreign key (current_revision_id) references public.project_revisions(id);
alter table public.projects
  add constraint projects_verified_revision_fk
  foreign key (verified_revision_id) references public.project_revisions(id);

create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  project_revision_id uuid not null references public.project_revisions(id),
  reviewer_email citext not null,
  reviewer_email_normalized_hash text not null,
  invitation_token_hash text not null unique,
  expires_at timestamptz not null,
  viewed_at timestamptz,
  consumed_at timestamptz,
  revoked_at timestamptz,
  otp_hash text,
  otp_expires_at timestamptz,
  otp_failed_attempts integer not null default 0,
  locked_until timestamptz,
  reminder_count integer not null default 0 check (reminder_count between 0 and 1),
  created_at timestamptz not null default now()
);

create table public.reviewer_sessions (
  id uuid primary key default gen_random_uuid(),
  verification_request_id uuid not null references public.verification_requests(id) on delete cascade,
  session_token_hash text not null unique,
  purpose text not null check (purpose in ('review', 'receipt')),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.verifications (
  id uuid primary key default gen_random_uuid(),
  verification_request_id uuid not null unique references public.verification_requests(id),
  approved_revision_id uuid references public.project_revisions(id),
  project_existed boolean not null,
  role_accurate boolean not null,
  outcome_accurate boolean not null,
  metric_accurate boolean,
  rehire_response public.rehire_response,
  reviewer_name text,
  reviewer_job_title text,
  reviewer_comment text check (char_length(reviewer_comment) <= 1000),
  show_company_name boolean not null default false,
  show_reviewer_name boolean not null default false,
  show_reviewer_job_title boolean not null default false,
  show_project_period boolean not null default false,
  show_outcome_statement boolean not null default false,
  show_outcome_metric boolean not null default false,
  show_reviewer_comment boolean not null default false,
  show_rehire_response boolean not null default false,
  company_domain_verified boolean not null default false,
  consent_status public.consent_status not null default 'active',
  reviewer_receipt_token_hash text not null unique,
  submitted_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  disputed_at timestamptz
);

create table public.published_evidence (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null unique references public.projects(id) on delete cascade,
  public_title text not null,
  public_service_category text not null,
  public_company_name text,
  public_project_start date,
  public_project_end date,
  public_outcome_statement text,
  public_outcome_metric_value numeric,
  public_outcome_metric_unit text,
  public_reviewer_name text,
  public_reviewer_job_title text,
  public_reviewer_comment text,
  public_rehire_response public.rehire_response,
  verification_badge text not null check (verification_badge = 'company_domain_verified'),
  published_at timestamptz not null default now(),
  active boolean not null default true
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_type public.actor_type not null,
  actor_id uuid,
  event_type text not null,
  object_type text not null,
  object_id uuid not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index profiles_user_id_idx on public.profiles(user_id);
create index projects_owner_id_idx on public.projects(owner_id);
create index project_revisions_project_id_idx on public.project_revisions(project_id);
create index verification_requests_revision_id_idx on public.verification_requests(project_revision_id);
create index verification_requests_active_token_idx
  on public.verification_requests(invitation_token_hash)
  where consumed_at is null and revoked_at is null;
create index reviewer_sessions_active_token_idx
  on public.reviewer_sessions(session_token_hash)
  where revoked_at is null;
create index published_evidence_profile_active_idx
  on public.published_evidence(profile_id, published_at desc)
  where active = true;
create index audit_events_object_idx
  on public.audit_events(object_type, object_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_revisions enable row level security;
alter table public.verification_requests enable row level security;
alter table public.reviewer_sessions enable row level security;
alter table public.verifications enable row level security;
alter table public.published_evidence enable row level security;
alter table public.audit_events enable row level security;

alter table public.profiles force row level security;
alter table public.projects force row level security;
alter table public.project_revisions force row level security;
alter table public.verification_requests force row level security;
alter table public.reviewer_sessions force row level security;
alter table public.verifications force row level security;
alter table public.published_evidence force row level security;
alter table public.audit_events force row level security;

create policy profiles_owner_all on public.profiles
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy projects_owner_select on public.projects
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy projects_owner_insert on public.projects
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy projects_owner_update on public.projects
  for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy project_revisions_owner_select on public.project_revisions
  for select to authenticated using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = (select auth.uid())
    )
  );

create policy verification_requests_owner_select on public.verification_requests
  for select to authenticated using (
    exists (
      select 1
      from public.project_revisions r
      join public.projects p on p.id = r.project_id
      where r.id = project_revision_id and p.owner_id = (select auth.uid())
    )
  );

create policy verifications_owner_select on public.verifications
  for select to authenticated using (
    exists (
      select 1
      from public.verification_requests vr
      join public.project_revisions r on r.id = vr.project_revision_id
      join public.projects p on p.id = r.project_id
      where vr.id = verification_request_id and p.owner_id = (select auth.uid())
    )
  );

create policy published_evidence_public_select on public.published_evidence
  for select to anon, authenticated using (active = true);

revoke all on all tables in schema public from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.projects to authenticated;
grant select on public.project_revisions to authenticated;
grant select on public.verification_requests to authenticated;
grant select on public.verifications to authenticated;
grant select on public.published_evidence to anon, authenticated;
```

All project, revision, request, verification, reviewer-session, publication, consent, and audit writes happen through narrowly granted security-definer RPCs. Do not add broad `grant all` statements.

- [ ] **Step 4: DBをリセットしてテストを通す**

Run:

```bash
npm run db:reset
npm run db:test
```

Expected: all pgTAP tests PASS.

- [ ] **Step 5: コミットする**

```bash
git add trust-platform/supabase
git commit -m "feat: add secure reputation data model"
```

## Task 4: 状態機械・改訂・公開フィルタの純粋ドメインロジックを作る

**Files:**
- Create: `trust-platform/src/domain/project-status.ts`
- Create: `trust-platform/src/domain/revisions.ts`
- Create: `trust-platform/src/domain/public-evidence.ts`
- Test: `trust-platform/src/domain/project-status.test.ts`
- Test: `trust-platform/src/domain/public-evidence.test.ts`

- [ ] **Step 1: 状態遷移の失敗テストを書く**

Create `trust-platform/src/domain/project-status.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { canTransition } from "./project-status";

describe("canTransition", () => {
  it.each([
    ["draft", "sent"],
    ["sent", "viewed"],
    ["viewed", "verified"],
    ["verified", "published"],
    ["published", "withdrawn"],
    ["published", "disputed"],
  ] as const)("allows %s -> %s", (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  it.each([
    ["declined", "published"],
    ["expired", "verified"],
    ["disputed", "published"],
    ["published", "verified"],
  ] as const)("rejects %s -> %s", (from, to) => {
    expect(canTransition(from, to)).toBe(false);
  });
});
```

- [ ] **Step 2: 公開フィルタの失敗テストを書く**

Create `trust-platform/src/domain/public-evidence.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildPublicEvidence } from "./public-evidence";

it("omits every field without explicit reviewer consent", () => {
  const result = buildPublicEvidence({
    revision: {
      title: "Reporting automation",
      serviceCategory: "AI automation",
      companyName: "Secret Corp",
      projectStart: "2026-01-01",
      projectEnd: "2026-02-01",
      outcomeStatement: "Saved 18 hours",
      outcomeMetricValue: 18,
      outcomeMetricUnit: "hours/week",
    },
    verification: {
      reviewerName: "Alex",
      reviewerJobTitle: "COO",
      reviewerComment: "Excellent",
      rehireResponse: "yes",
      showCompanyName: false,
      showReviewerName: false,
      showReviewerJobTitle: false,
      showProjectPeriod: false,
      showOutcomeStatement: true,
      showOutcomeMetric: false,
      showReviewerComment: false,
      showRehireResponse: false,
    },
  });

  expect(result).toMatchObject({
    publicTitle: "Reporting automation",
    publicOutcomeStatement: "Saved 18 hours",
    publicCompanyName: null,
    publicReviewerName: null,
    publicOutcomeMetricValue: null,
  });
});
```

- [ ] **Step 3: 失敗を確認する**

Run:

```bash
npm test -- src/domain/project-status.test.ts src/domain/public-evidence.test.ts
```

Expected: FAIL because modules do not exist.

- [ ] **Step 4: 最小実装を書く**

Create `trust-platform/src/domain/project-status.ts`:

```ts
export const projectStatuses = [
  "draft", "sent", "viewed", "verified", "published",
  "withdrawn", "expired", "declined", "disputed",
] as const;
export type ProjectStatus = (typeof projectStatuses)[number];

const transitions: Record<ProjectStatus, readonly ProjectStatus[]> = {
  draft: ["sent"],
  sent: ["viewed", "expired", "declined", "draft"],
  viewed: ["verified", "expired", "declined", "draft"],
  verified: ["published", "draft", "disputed", "withdrawn"],
  published: ["withdrawn", "disputed", "draft"],
  withdrawn: ["published", "draft", "disputed"],
  expired: ["draft", "sent"],
  declined: ["draft"],
  disputed: ["withdrawn", "draft"],
};

export function canTransition(from: ProjectStatus, to: ProjectStatus) {
  return transitions[from].includes(to);
}
```

Create `trust-platform/src/domain/public-evidence.ts` with typed input and a `buildPublicEvidence` function that always returns required title/category/badge and maps each sensitive field to its value only when the corresponding `show*` boolean is `true`; otherwise it returns `null`.

Create `trust-platform/src/domain/revisions.ts`:

```ts
import { createHash } from "node:crypto";

export function revisionContentHash(value: object) {
  return createHash("sha256")
    .update(JSON.stringify(value, Object.keys(value).sort()))
    .digest("hex");
}

export function nextRevisionNumber(existing: readonly number[]) {
  return existing.length === 0 ? 1 : Math.max(...existing) + 1;
}
```

- [ ] **Step 5: テストを通す**

Run:

```bash
npm test -- src/domain
```

Expected: all PASS.

- [ ] **Step 6: コミットする**

```bash
git add trust-platform/src/domain
git commit -m "feat: add project verification domain rules"
```

## Task 5: プロフィールオンボーディングと案件ドラフトを作る

**Files:**
- Create: `trust-platform/src/app/actions/profile.ts`
- Create: `trust-platform/src/app/actions/projects.ts`
- Create: `trust-platform/src/data/profiles.ts`
- Create: `trust-platform/src/data/projects.ts`
- Create: `trust-platform/supabase/migrations/2026062300015_project_drafts.sql`
- Create: `trust-platform/supabase/tests/0025_project_drafts.test.sql`
- Create: `trust-platform/src/components/profile-form.tsx`
- Create: `trust-platform/src/components/project-form.tsx`
- Create: `trust-platform/src/app/(app)/onboarding/page.tsx`
- Create: `trust-platform/src/app/(app)/dashboard/page.tsx`
- Create: `trust-platform/src/app/(app)/projects/new/page.tsx`
- Create: `trust-platform/src/app/(app)/projects/[projectId]/page.tsx`
- Test: `trust-platform/src/app/actions/projects.test.ts`

- [ ] **Step 1: 案件入力スキーマの失敗テストを書く**

Create `trust-platform/src/app/actions/projects.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseProjectDraft } from "./projects";

describe("parseProjectDraft", () => {
  it("requires a matching company email domain", () => {
    expect(() =>
      parseProjectDraft({
        title: "Automation",
        companyName: "Acme",
        companyDomain: "acme.com",
        reviewerEmail: "reviewer@gmail.com",
        serviceCategory: "AI automation",
        roleDescription: "Built the workflow",
        summary: "Automated reporting",
        outcomeStatement: "Saved time",
      }),
    ).toThrow("company domain");
  });
});
```

- [ ] **Step 2: 失敗を確認する**

Run:

```bash
npm test -- src/app/actions/projects.test.ts
```

Expected: FAIL because parser does not exist.

- [ ] **Step 3: 入力スキーマとServer Actionsを実装する**

In `trust-platform/src/app/actions/projects.ts`, export a pure `parseProjectDraft` using Zod. Normalize domains with `new URL("https://" + domain).hostname`, lowercase them, reject a maintained consumer-domain set (`gmail.com`, `outlook.com`, `hotmail.com`, `yahoo.com`, `icloud.com`, `proton.me`, `protonmail.com`), and require `reviewerEmail.split("@")[1] === companyDomain`.

The `createProject` Server Action must:

```ts
"use server";

const userId = await getCurrentUserId();
const input = parseProjectDraft(Object.fromEntries(formData));
const project = await insertProjectWithRevision({ userId, input });
redirect(`/projects/${project.id}`);
```

Create `2026062300015_project_drafts.sql` with an authenticated `create_project_draft` security-definer RPC. It must set `search_path = ''`, validate `auth.uid()`, insert the project, insert revision 1, update `current_revision_id`, append `project.created`, and return only project ID and status. Revoke execution from `public` and grant it to `authenticated`.

The DAL function `insertProjectWithRevision` calls that RPC, calculates `content_hash`, and returns only `{ id, status }`.

`0025_project_drafts.test.sql` proves a caller cannot create a project for a different `owner_id` and proves the audit event is appended in the same transaction.

- [ ] **Step 4: プロフィールと案件フォームを実装する**

`ProfileForm` fields:

```ts
type ProfileFields = {
  displayName: string;
  slug: string;
  headline: string;
  bio: string;
  countryCode: string;
  timeZone: string;
  serviceCategories: string[];
};
```

`ProjectForm` fields:

```ts
type ProjectDraftFields = {
  title: string;
  companyName: string;
  companyWebsite?: string;
  companyDomain: string;
  reviewerEmail: string;
  serviceCategory: string;
  projectStart?: string;
  projectEnd?: string;
  roleDescription: string;
  summary: string;
  outcomeStatement: string;
  outcomeMetricValue?: string;
  outcomeMetricUnit?: string;
};
```

Both forms use `useActionState`, accessible labels, field-level errors, a pending state, and no client-side database access.

- [ ] **Step 5: ダッシュボードと詳細画面を実装する**

Dashboard displays:

- profile completion.
- project counts by status.
- list of projects with status badges.
- primary CTA `Add completed project`.

Project detail displays:

- current immutable revision.
- verification status timeline.
- send/re-send action area.
- publish/withdraw area only when allowed by state.

- [ ] **Step 6: テストとビルドを通す**

Run:

```bash
npm test -- src/app/actions/projects.test.ts
npm run lint
npm run typecheck
npm run build
```

Expected: all PASS.

- [ ] **Step 7: コミットする**

```bash
git add trust-platform
git commit -m "feat: add professional profile and project drafts"
```

## Task 6: メールアダプターと暗号プリミティブを作る

**Files:**
- Create: `trust-platform/src/lib/security/tokens.ts`
- Create: `trust-platform/src/lib/security/otp.ts`
- Create: `trust-platform/src/lib/email/types.ts`
- Create: `trust-platform/src/lib/email/smtp-transport.ts`
- Create: `trust-platform/src/lib/email/resend-transport.ts`
- Create: `trust-platform/src/lib/email/index.ts`
- Create: `trust-platform/src/lib/email/templates.ts`
- Test: `trust-platform/src/lib/security/tokens.test.ts`
- Test: `trust-platform/src/lib/email/templates.test.ts`

- [ ] **Step 1: セキュリティプリミティブの失敗テストを書く**

```ts
import { describe, expect, it } from "vitest";
import { createOpaqueToken, hashOpaqueToken } from "./tokens";
import { createOtp, hashOtp } from "./otp";

it("creates a 256-bit opaque token and stable hash", () => {
  const token = createOpaqueToken();
  expect(Buffer.from(token, "base64url")).toHaveLength(32);
  expect(hashOpaqueToken(token)).toBe(hashOpaqueToken(token));
});

it("creates a six digit OTP and keyed hash", () => {
  const otp = createOtp();
  expect(otp).toMatch(/^\d{6}$/);
  expect(hashOtp(otp)).toHaveLength(64);
});
```

- [ ] **Step 2: 失敗を確認する**

Run:

```bash
npm test -- src/lib/security
```

Expected: FAIL.

- [ ] **Step 3: トークンとOTPを実装する**

Create `tokens.ts`:

```ts
import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export const createOpaqueToken = () => randomBytes(32).toString("base64url");
export const hashOpaqueToken = (token: string) =>
  createHash("sha256").update(`${env.TOKEN_PEPPER}:${token}`).digest("hex");
export function tokenHashesEqual(a: string, b: string) {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}
```

Create `otp.ts`:

```ts
import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export const createOtp = () => randomInt(0, 1_000_000).toString().padStart(6, "0");
export const hashOtp = (otp: string) =>
  createHmac("sha256", env.OTP_PEPPER).update(otp).digest("hex");
export function otpHashesEqual(a: string, b: string) {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}
```

- [ ] **Step 4: メールアダプターを実装する**

Create `types.ts`:

```ts
export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export interface EmailTransport {
  send(message: EmailMessage): Promise<{ id: string }>;
}
```

`smtp-transport.ts` uses `nodemailer.createTransport({ host, port, secure: false })`.

`resend-transport.ts` uses `new Resend(env.RESEND_API_KEY).emails.send(...)`.

`index.ts` returns the configured adapter from `env.MAIL_TRANSPORT`.

`templates.ts` exports deterministic plain text and escaped HTML templates for verification invitation, OTP, completion, decline, receipt, withdrawal, and dispute. No template may interpolate unescaped user text.

- [ ] **Step 5: テンプレート漏洩テストを書く**

Test that invitation and OTP templates:

- include professional display name and expiration.
- never include token hashes, OTP hashes, reviewer-email hashes, or secret keys.
- HTML-escape `<script>` in professional or project names.

- [ ] **Step 6: テストを通してコミットする**

Run:

```bash
npm test -- src/lib/security src/lib/email
npm run typecheck
```

Expected: all PASS.

```bash
git add trust-platform/src/lib
git commit -m "feat: add secure tokens and email transports"
```

## Task 7: 検証依頼送信・凍結改訂・監査記録を作る

**Files:**
- Create: `trust-platform/supabase/migrations/202606230002_verification_rpcs.sql`
- Create: `trust-platform/src/app/actions/verification-requests.ts`
- Create: `trust-platform/src/data/verification-requests.ts`
- Test: `trust-platform/src/app/actions/verification-requests.test.ts`
- Test: `trust-platform/supabase/tests/003_verification_request.test.sql`

- [ ] **Step 1: DBトランザクションの失敗テストを書く**

`003_verification_request.test.sql` verifies that a single RPC:

- locks the current revision.
- sets project state to `sent`.
- creates one request.
- appends `verification_request.created`.
- rejects a second active request for the same revision.

- [ ] **Step 2: Actionの失敗テストを書く**

Mock the DAL and mail transport. Assert that:

- unauthorized user is rejected.
- request is persisted before email is sent.
- mail failure leaves an auditable `delivery_failed` event and returns a retry-safe error.
- one reminder is allowed and a second reminder is rejected.
- an expired request can be revoked and replaced with a new 72-hour request.

- [ ] **Step 3: 失敗を確認する**

Run:

```bash
npm run db:test
npm test -- src/app/actions/verification-requests.test.ts
```

Expected: FAIL.

- [ ] **Step 4: `create_verification_request` RPCを実装する**

The security-definer function accepts project ID, token hash, reviewer hashes, and expiry; validates `(select auth.uid()) = projects.owner_id`; locks the project row; requires `draft|expired`; locks the current revision; inserts the request; transitions to `sent`; appends a sanitized audit event; and returns request ID plus reviewer email.

Set:

```sql
security definer
set search_path = ''
```

Revoke direct execution from `public`, grant it only to `authenticated`, and keep all table writes unavailable to the browser.

- [ ] **Step 5: Server Actionを実装する**

`sendVerificationRequest(projectId)`:

1. require authenticated user.
2. load owned project and revision.
3. generate invitation token and hash.
4. call RPC with `expires_at = now + 72 hours`.
5. send `verificationInvitation`.
6. record delivery success/failure through a server-only audit helper.
7. return generic success to avoid exposing reviewer state.

Also implement:

```ts
export async function sendVerificationReminder(requestId: string) {
  const userId = await getCurrentUserId();
  const request = await claimSingleReminder({ userId, requestId });
  await getEmailTransport().send(
    verificationInvitation({
      to: request.reviewerEmail,
      professionalName: request.professionalName,
      projectTitle: request.projectTitle,
      invitationUrl: request.invitationUrl,
      expiresAt: request.expiresAt,
      isReminder: true,
    }),
  );
  return { ok: true };
}

export async function replaceExpiredVerificationRequest(projectId: string) {
  const userId = await getCurrentUserId();
  await revokeExpiredRequest({ userId, projectId });
  return sendVerificationRequest(projectId);
}
```

`claimSingleReminder` increments `reminder_count` atomically only when it is zero and the request is still active.

The invitation URL is:

```ts
`${env.APP_URL}/verify/${requestId}?token=${encodeURIComponent(invitationToken)}`
```

- [ ] **Step 6: テストを通してコミットする**

Run:

```bash
npm run db:reset
npm run db:test
npm test -- src/app/actions/verification-requests.test.ts
```

Expected: all PASS.

```bash
git add trust-platform
git commit -m "feat: send auditable verification requests"
```

## Task 8: 企業の招待リンク＋OTP認証を作る

**Files:**
- Create: `trust-platform/src/data/reviewer-auth.ts`
- Create: `trust-platform/src/app/actions/reviewer-auth.ts`
- Create: `trust-platform/src/app/verify/[requestId]/page.tsx`
- Create: `trust-platform/src/components/reviewer-otp-form.tsx`
- Create: `trust-platform/supabase/migrations/202606230003_reviewer_auth_rpcs.sql`
- Test: `trust-platform/src/data/reviewer-auth.test.ts`
- Test: `trust-platform/supabase/tests/004_reviewer_auth.test.sql`

- [ ] **Step 1: OTPロックアウトの失敗テストを書く**

Test these exact rules:

- invitation expired, consumed, or revoked => invalid.
- opening a valid invitation sets `viewed_at` but does not consume it.
- OTP expires after ten minutes.
- five failed OTP attempts lock the request for 30 minutes.
- successful OTP creates a 30-minute reviewer session and clears OTP material.
- session token is stored only as a hash.

- [ ] **Step 2: 失敗を確認する**

Run:

```bash
npm run db:test
npm test -- src/data/reviewer-auth.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Reviewer auth RPCsを実装する**

Implement server-only RPCs or transaction helpers:

- `mark_verification_viewed(request_id, invitation_hash)`.
- `set_reviewer_otp(request_id, invitation_hash, otp_hash, otp_expires_at)`.
- `verify_reviewer_otp(request_id, invitation_hash, submitted_otp_hash, session_hash)`.

Each function checks expiry/revocation/lock state atomically and writes sanitized audit events.

- [ ] **Step 4: 招待ページを実装する**

`/verify/[requestId]?token=...`:

- validates token server-side.
- marks viewed without consuming.
- shows professional name, project title, expiry, verification explanation.
- posts `requestOtp`.

`requestOtp` always returns:

```ts
{ ok: true, message: "If the invitation is valid, a code has been sent." }
```

This prevents public enumeration.

- [ ] **Step 5: OTP検証とCookieを実装する**

On success:

```ts
const sessionToken = createOpaqueToken();
await createReviewerSession(requestId, hashOpaqueToken(sessionToken), "review");
cookieStore.set(`vrp_review_${requestId}`, sessionToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: `/verify/${requestId}`,
  maxAge: 60 * 30,
});
redirect(`/verify/${requestId}/review`);
```

- [ ] **Step 6: テストを通してコミットする**

Run:

```bash
npm run db:reset
npm run db:test
npm test -- src/data/reviewer-auth.test.ts
npm run build
```

Expected: all PASS.

```bash
git add trust-platform
git commit -m "feat: secure company review access with email otp"
```

## Task 9: 企業レビュー・修正・項目別公開同意を作る

**Files:**
- Create: `trust-platform/src/domain/verification.ts`
- Create: `trust-platform/src/app/actions/reviewer-verification.ts`
- Create: `trust-platform/src/data/verifications.ts`
- Create: `trust-platform/src/components/verification-review-form.tsx`
- Create: `trust-platform/src/components/public-evidence-preview.tsx`
- Create: `trust-platform/src/app/verify/[requestId]/review/page.tsx`
- Create: `trust-platform/supabase/migrations/202606230004_submit_verification.sql`
- Test: `trust-platform/src/domain/verification.test.ts`
- Test: `trust-platform/supabase/tests/005_submit_verification.test.sql`

- [ ] **Step 1: Reviewer入力の失敗テストを書く**

Test:

- `projectExisted=false` forces decline and no approved revision.
- corrected text creates a reviewer-authored immutable revision.
- metric visibility cannot be true when no metric exists.
- reviewer name/title visibility cannot be true when those fields are blank.
- submission consumes request and revokes reviewer sessions.

- [ ] **Step 2: 失敗を確認する**

Run:

```bash
npm test -- src/domain/verification.test.ts
npm run db:test
```

Expected: FAIL.

- [ ] **Step 3: Zodスキーマとプレビュー変換を実装する**

`ReviewerVerificationInput` includes:

```ts
{
  projectExisted: boolean;
  roleAccurate: boolean;
  outcomeAccurate: boolean;
  metricAccurate: boolean | null;
  correctedRoleDescription?: string;
  correctedOutcomeStatement?: string;
  correctedOutcomeMetricValue?: number;
  correctedOutcomeMetricUnit?: string;
  rehireResponse: "yes" | "maybe" | "no" | null;
  reviewerName?: string;
  reviewerJobTitle?: string;
  reviewerComment?: string;
  visibility: {
    companyName: boolean;
    reviewerName: boolean;
    reviewerJobTitle: boolean;
    projectPeriod: boolean;
    outcomeStatement: boolean;
    outcomeMetric: boolean;
    reviewerComment: boolean;
    rehireResponse: boolean;
  };
}
```

The preview component must call the same `buildPublicEvidence` pure function used by publication.

- [ ] **Step 4: `submit_verification` transactionを実装する**

The transaction:

1. validates reviewer session hash and purpose.
2. locks request and rejects consumed/expired/revoked requests.
3. creates corrected revision when needed.
4. inserts verification.
5. sets request `consumed_at`.
6. revokes all reviewer sessions for the request.
7. sets project to `verified` or `declined`.
8. creates receipt token hash.
9. appends audit events.
10. stores the receipt-token hash supplied by the server and returns only verification ID and status.

- [ ] **Step 5: Review UIを実装する**

Use a single page with:

- factual confirmation controls.
- inline correction fields.
- optional reviewer attribution.
- eight field-level visibility switches.
- exact public preview.
- explicit consent checkbox.
- final submit button.

The button text is `Submit verification`, not `Leave a positive review`.

- [ ] **Step 6: Receiptメールを送る**

Before calling the transaction, the server generates a raw receipt token and passes only `hashOpaqueToken(receiptToken)` into the transaction. After the transaction commits, email the original reviewer:

```ts
`${env.APP_URL}/verification-receipt/${verificationId}?token=${receiptToken}`
```

The mail explains that receipt viewing and any future change require a fresh OTP.

- [ ] **Step 7: テストを通してコミットする**

Run:

```bash
npm run db:reset
npm run db:test
npm test -- src/domain/verification.test.ts
npm run build
```

Expected: all PASS.

```bash
git add trust-platform
git commit -m "feat: add client-controlled project verification"
```

## Task 10: 公開処理と安全な公開プロフィールを作る

**Files:**
- Create: `trust-platform/supabase/migrations/202606230005_publish_evidence.sql`
- Create: `trust-platform/src/app/actions/publication.ts`
- Create: `trust-platform/src/app/actions/profile-sharing.ts`
- Create: `trust-platform/src/data/public-profiles.ts`
- Create: `trust-platform/src/app/p/[slug]/page.tsx`
- Create: `trust-platform/src/app/p/[slug]/opengraph-image.tsx`
- Create: `trust-platform/src/components/evidence-card.tsx`
- Test: `trust-platform/src/data/public-profiles.test.ts`
- Test: `trust-platform/supabase/tests/006_publication.test.sql`

- [ ] **Step 1: 公開漏洩の失敗テストを書く**

Test that publication:

- requires project owner and `verified` state.
- requires active company consent.
- copies only `buildPublicEvidence` output.
- never exposes reviewer email, private company data, hashes, audit metadata, or hidden fields.
- deactivates evidence on professional withdrawal.

- [ ] **Step 2: 失敗を確認する**

Run:

```bash
npm test -- src/data/public-profiles.test.ts
npm run db:test
```

Expected: FAIL.

- [ ] **Step 3: Publish/withdraw RPCを実装する**

`publish_verified_project(project_id)` validates `auth.uid`, joins the verified revision and active verification, inserts/upserts sanitized `published_evidence`, and transitions to `published`.

`withdraw_published_project(project_id)` validates owner, sets evidence inactive, transitions to `withdrawn`, and leaves company consent active.

Add `recordProfileLinkCopied`:

```ts
"use server";

export async function recordProfileLinkCopied() {
  const userId = await getCurrentUserId();
  await appendAuditEvent({
    actorType: "professional",
    actorId: userId,
    eventType: "profile.link_copied",
    objectType: "profile",
    objectId: await getOwnedProfileId(userId),
    metadata: {},
  });
}
```

The dashboard copy button copies `/p/[slug]` and invokes this action. Verification completion, publication, withdrawal, dispute, and link-copy events make the initial business metrics derivable without adding a third-party analytics SDK.

- [ ] **Step 4: 公開DTOを実装する**

`getPublicProfileDTO(slug)` returns:

```ts
type PublicProfileDTO = {
  slug: string;
  displayName: string;
  headline: string;
  bio: string;
  countryCode: string | null;
  timeZone: string | null;
  serviceCategories: string[];
  verifiedProjectCount: number;
  evidence: Array<{
    id: string;
    title: string;
    serviceCategory: string;
    companyName: string | null;
    projectPeriod: string | null;
    outcomeStatement: string | null;
    outcomeMetric: string | null;
    reviewerAttribution: string | null;
    reviewerComment: string | null;
    rehireResponse: "yes" | "maybe" | "no" | null;
    badge: "company_domain_verified";
  }>;
};
```

The DTO queries only public profile fields and active `published_evidence`.

- [ ] **Step 5: 公開ページとOG画像を実装する**

Both page and OG route call `getPublicProfileDTO`. The OG image uses only display name, headline, count, and service categories. It must not independently query private tables.

- [ ] **Step 6: テストを通してコミットする**

Run:

```bash
npm run db:reset
npm run db:test
npm test -- src/data/public-profiles.test.ts
npm run build
```

Expected: all PASS.

```bash
git add trust-platform
git commit -m "feat: publish consent-filtered reputation profiles"
```

## Task 11: 企業の受領確認・撤回・異議申立てを作る

**Files:**
- Create: `trust-platform/src/app/verification-receipt/[verificationId]/page.tsx`
- Create: `trust-platform/src/app/actions/receipt-auth.ts`
- Create: `trust-platform/src/app/actions/consent.ts`
- Create: `trust-platform/src/data/consent.ts`
- Create: `trust-platform/src/components/receipt-actions.tsx`
- Create: `trust-platform/supabase/migrations/202606230006_withdraw_dispute.sql`
- Test: `trust-platform/src/data/consent.test.ts`
- Test: `trust-platform/supabase/tests/007_consent.test.sql`

- [ ] **Step 1: 撤回・異議申立ての失敗テストを書く**

Test:

- raw receipt link alone cannot view details or mutate consent.
- a fresh OTP to the original reviewer email is required.
- company withdrawal sets consent `withdrawn`, evidence inactive, project `withdrawn`.
- dispute sets consent `disputed`, evidence inactive, project `disputed`.
- company-withdrawn evidence cannot be republished without a new verification.
- repeated withdrawal/dispute is idempotent.

- [ ] **Step 2: 失敗を確認する**

Run:

```bash
npm test -- src/data/consent.test.ts
npm run db:test
```

Expected: FAIL.

- [ ] **Step 3: Receipt OTP flowを実装する**

Reuse reviewer OTP primitives, but create a `reviewer_sessions.purpose = 'receipt'` session. Set a separate HttpOnly cookie:

```ts
cookieStore.set(`vrp_receipt_${verificationId}`, sessionToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: `/verification-receipt/${verificationId}`,
  maxAge: 60 * 15,
});
```

- [ ] **Step 4: Atomic consent RPCsを実装する**

`withdraw_company_consent(verification_id, receipt_session_hash)` and `open_verification_dispute(...)` validate session purpose, original verification, and active session; deactivate evidence in the same transaction; append audit events; revoke receipt session.

- [ ] **Step 5: Receipt UIを実装する**

After OTP, show:

- approved public preview.
- consent status.
- `Withdraw public consent` destructive action.
- `Report a dispute` action with required reason of 20–2000 characters.

Require confirmation dialogs and do not show hidden professional/private fields.

- [ ] **Step 6: テストを通してコミットする**

Run:

```bash
npm run db:reset
npm run db:test
npm test -- src/data/consent.test.ts
npm run build
```

Expected: all PASS.

```bash
git add trust-platform
git commit -m "feat: add secure consent withdrawal and disputes"
```

## Task 12: レート制限・監査・Webセキュリティヘッダーを固める

**Files:**
- Create: `trust-platform/src/lib/security/rate-limit.ts`
- Create: `trust-platform/src/lib/security/origin.ts`
- Create: `trust-platform/src/lib/security/errors.ts`
- Create: `trust-platform/src/data/audit.ts`
- Create: `trust-platform/supabase/migrations/202606230007_rate_limits.sql`
- Modify: `trust-platform/next.config.ts`
- Modify: `trust-platform/src/lib/supabase/proxy.ts`
- Modify: `trust-platform/src/proxy.ts`
- Test: `trust-platform/src/lib/security/rate-limit.test.ts`
- Test: `trust-platform/src/lib/security/origin.test.ts`

- [ ] **Step 1: レート制限とOriginの失敗テストを書く**

Test:

- wrong `Origin` is rejected for sensitive POST handlers.
- missing Origin is allowed only for same-site Server Action paths that Next validates.
- OTP sends are limited by request ID, destination hash, account, and IP hash.
- audit metadata rejects keys matching `token`, `otp`, `email`, `secret`, `ip`.

- [ ] **Step 2: 失敗を確認する**

Run:

```bash
npm test -- src/lib/security/rate-limit.test.ts src/lib/security/origin.test.ts
```

Expected: FAIL.

- [ ] **Step 3: DB-backed fixed-window limiterを実装する**

Create a private `rate_limit_buckets` table keyed by `scope_hash`, `window_started_at`, and `count`. A security-definer RPC atomically increments and returns `{ allowed, retry_after_seconds }`. Never store raw IPs or reviewer emails; hash normalized values with `TOKEN_PEPPER`.

Use limits:

- invitation send: 5/account/hour, 3/destination/day.
- reminder: 1/request.
- OTP send: 5/request/hour, 3/destination/hour.
- OTP verify: existing five-attempt request lock plus 20/IP-hash/hour.
- withdrawal/dispute OTP: 5/verification/hour.

- [ ] **Step 4: リクエストごとのnonce付きCSPをProxyへ追加する**

Update `src/lib/supabase/proxy.ts` so `updateSession` accepts the request with the nonce-bearing headers and preserves those headers when it constructs `NextResponse`.

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(
  request: NextRequest,
  requestHeaders = new Headers(request.headers),
) {
  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values) => {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: { headers: requestHeaders },
          });
          values.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.getClaims();
  return response;
}
```

Update `src/proxy.ts`:

```ts
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' blob: data:",
    "font-src 'self'",
    `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = await updateSession(request, requestHeaders);
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
```

Pages covered by this matcher use dynamic rendering so Next.js can apply the nonce. Add static non-CSP headers for API routes in `next.config.ts`; API handlers must also run the explicit origin checks from Step 1.

Update `src/app/layout.tsx` to call `await connection()` from `next/server`, ensuring nonce-covered pages render per request.

- [ ] **Step 5: 相関IDと安全なエラーを実装する**

Every sensitive handler returns a generic user message and logs:

```ts
{
  correlationId,
  errorCode,
  requestId,
}
```

Do not log raw submitted forms, emails, tokens, OTPs, or full IPs.

- [ ] **Step 6: テストを通してコミットする**

Run:

```bash
npm run db:reset
npm run db:test
npm test -- src/lib/security
npm run lint
npm run typecheck
```

Expected: all PASS.

```bash
git add trust-platform
git commit -m "feat: harden verification security controls"
```

## Task 13: 法務ページ・英語コピー・メタデータ・アクセシビリティを完成させる

**Files:**
- Create: `trust-platform/src/content/legal.ts`
- Create: `trust-platform/src/content/en.ts`
- Create: `trust-platform/src/app/legal/privacy/page.tsx`
- Create: `trust-platform/src/app/legal/terms/page.tsx`
- Create: `trust-platform/src/app/legal/verification-policy/page.tsx`
- Create: `trust-platform/src/app/legal/privacy-request/page.tsx`
- Create: `trust-platform/src/app/actions/privacy-request.ts`
- Create: `trust-platform/src/app/legal/report-abuse/page.tsx`
- Create: `trust-platform/src/app/actions/report-abuse.ts`
- Create: `trust-platform/src/app/sitemap.ts`
- Create: `trust-platform/src/app/robots.ts`
- Modify: `trust-platform/src/app/layout.tsx`
- Modify: all user-facing forms and pages
- Test: `trust-platform/src/components/accessibility.test.tsx`

- [ ] **Step 1: 法務・アクセシビリティの失敗テストを書く**

Test that:

- every form field has a label.
- errors use `aria-describedby`.
- status changes use `aria-live`.
- verification policy contains the exact concepts `mailbox control`, `not formal legal authorization`, `field-level consent`, `withdraw`, and `dispute`.
- privacy request form rejects invalid email and unsupported request types.
- abuse report accepts a request ID, reporter email, and 20–2000 character reason without requiring reviewer authentication.

- [ ] **Step 2: 失敗を確認する**

Run:

```bash
npm test -- src/components/accessibility.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: 法務ページを実装する**

`legal.ts` contains launch-ready English draft copy, clearly labeled as policy text requiring counsel review before broad production. It covers:

- collected data and purpose.
- verification evidence.
- retention and deletion.
- field-level consent.
- withdrawal and dispute.
- abuse and fraud prevention.
- international processing.
- contact address configured through `LEGAL_CONTACT_EMAIL`.

Add `LEGAL_CONTACT_EMAIL` to `env-schema.ts`, `.env.example`, `src/test/setup.ts`, and the complete-environment test in `env-schema.test.ts`.

Create `src/content/en.ts` as the single source for navigation labels, status labels, form copy, verification explanations, and error messages. Components import strings from this module rather than embedding product copy across files.

Implement `privacy-request.ts`:

```ts
"use server";

import { z } from "zod";
import { getEmailTransport } from "@/lib/email";
import { escapeHtml } from "@/lib/email/templates";
import { env } from "@/lib/env";

const schema = z.object({
  requestType: z.enum(["access", "correction", "deletion", "other"]),
  email: z.email().trim().toLowerCase(),
  details: z.string().trim().min(20).max(2000),
});

export async function submitPrivacyRequest(
  _: { ok?: boolean; error?: string },
  formData: FormData,
) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Check the request details and try again." };
  const safeEmail = escapeHtml(parsed.data.email);
  const safeDetails = escapeHtml(parsed.data.details).replaceAll("\n", "<br>");
  await getEmailTransport().send({
    to: env.LEGAL_CONTACT_EMAIL,
    subject: `Privacy request: ${parsed.data.requestType}`,
    text: `Requester: ${parsed.data.email}\n\n${parsed.data.details}`,
    html: `<p>Requester: ${safeEmail}</p><p>${safeDetails}</p>`,
  });
  return { ok: true };
}
```

Rate-limit this action and show that identity verification may be required before fulfillment.

Implement `report-abuse.ts` with the same escaped-email pattern. It emails `LEGAL_CONTACT_EMAIL`, records only a sanitized `abuse.reported` audit event when the request ID exists, and always returns the same success message whether the request ID exists or not. Verification invitation and OTP emails link to `/legal/report-abuse?requestId=<id>`.

- [ ] **Step 4: Metadataを実装する**

Root metadata:

```ts
export const metadata = {
  title: {
    default: "Verified Work",
    template: "%s · Verified Work",
  },
  description: "Portable, client-approved evidence for independent AI consultants.",
  metadataBase: new URL(env.APP_URL),
};
```

Add canonical public profile URLs, sitemap entries for public profiles/legal pages, and disallow `/dashboard`, `/projects`, `/verify`, `/verification-receipt`, and `/api` in robots.

- [ ] **Step 5: 全画面のキーボード・コントラスト・モーションを確認する**

Requirements:

- visible focus ring.
- no color-only status communication.
- `prefers-reduced-motion` respected.
- destructive actions require text confirmation.
- tap targets at least 44px.
- headings follow hierarchy.

- [ ] **Step 6: テストを通してコミットする**

Run:

```bash
npm test -- src/components/accessibility.test.tsx
npm run lint
npm run typecheck
npm run build
```

Expected: all PASS.

```bash
git add trust-platform
git commit -m "feat: add accessible legal and public metadata"
```

## Task 14: Playwright E2Eと公開漏洩テストを完成させる

**Files:**
- Create: `trust-platform/playwright.config.ts`
- Create: `trust-platform/tests/e2e/helpers/mailpit.ts`
- Create: `trust-platform/tests/e2e/verification-flow.spec.ts`
- Create: `trust-platform/tests/e2e/security.spec.ts`
- Create: `trust-platform/supabase/seed.sql`

- [ ] **Step 1: E2Eを先に書く**

`verification-flow.spec.ts` performs:

1. professional magic-link sign-in by reading Mailpit.
2. onboarding.
3. project creation.
4. verification invitation send.
5. reviewer opens invitation.
6. reviewer requests OTP and reads it from Mailpit.
7. reviewer corrects outcome and selects only outcome visibility.
8. reviewer submits.
9. professional publishes.
10. public page shows corrected outcome and hides company/reviewer.
11. reviewer receipt OTP.
12. company withdrawal.
13. public evidence disappears immediately.

`security.spec.ts` asserts:

- another authenticated user gets 404/403 for project ID.
- invitation reuse fails.
- expired token fails.
- hidden values are absent from page HTML and OG response.
- `<script>alert(1)</script>` renders as text.
- API responses contain no secret key or hashes.

- [ ] **Step 2: Mailpit helperを実装する**

```ts
export async function waitForMail(
  recipient: string,
  subjectIncludes: string,
  timeoutMs = 15_000,
) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const response = await fetch("http://127.0.0.1:54324/api/v1/messages");
    const payload = await response.json();
    const message = payload.messages.find(
      (item: { To: Array<{ Address: string }>; Subject: string }) =>
        item.To.some((to) => to.Address === recipient) &&
        item.Subject.includes(subjectIncludes),
    );
    if (message) return message;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Mail not received: ${recipient} / ${subjectIncludes}`);
}
```

- [ ] **Step 3: Playwright設定を実装する**

Configure Chromium only, base URL `http://127.0.0.1:3000`, trace on first retry, and a `webServer` command:

```ts
command: "npm run dev -- --hostname 127.0.0.1"
```

Use a global setup that runs `npm run db:reset`.

- [ ] **Step 4: E2Eを実行して修正する**

Run:

```bash
npm run db:start
npm run db:reset
npm run test:e2e
```

Expected: all Playwright tests PASS.

- [ ] **Step 5: 全テストスイートを実行する**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run db:test
npm run test:e2e
npm run build
```

Expected: all PASS.

- [ ] **Step 6: コミットする**

```bash
git add trust-platform
git commit -m "test: cover complete verification security flow"
```

## Task 15: 運用ドキュメント・本番準備・既存アプリ回帰確認を行う

**Files:**
- Modify: `trust-platform/README.md`
- Create: `trust-platform/docs/security-model.md`
- Create: `trust-platform/docs/production-checklist.md`
- Modify: root `.gitignore`

- [ ] **Step 1: READMEを完成させる**

Document exact commands:

```bash
cd trust-platform
npm install
npx supabase start
cp .env.example .env.local
npm run db:reset
npm run dev
```

Also document Mailpit, Studio, tests, migrations, and production environment variables.

- [ ] **Step 2: セキュリティモデルを書く**

`security-model.md` includes:

- trust boundaries.
- mailbox-control meaning and limitations.
- token and OTP lifecycle.
- RLS ownership model.
- public projection model.
- consent withdrawal/dispute.
- audit data exclusions.
- incident response first actions.

- [ ] **Step 3: 本番チェックリストを書く**

`production-checklist.md` requires:

- create a dedicated Supabase project.
- use publishable and secret keys, not deprecated legacy keys.
- configure Resend verified domain.
- configure custom Supabase SMTP.
- set production redirect URLs.
- set Auth and application rate limits.
- enable backups and point-in-time recovery appropriate to plan.
- run Security Advisor and Performance Advisor.
- review legal copy with counsel.
- test deletion/export/withdrawal requests.
- confirm no test inbox or local SMTP configuration is deployed.

- [ ] **Step 4: 一時設計成果物をignoreする**

Add to the root `.gitignore` only:

```gitignore
/.lazyweb/
/.superpowers/
```

Do not stage or delete the user’s existing files inside those directories.

- [ ] **Step 5: 新旧両アプリの回帰確認を行う**

Run in `trust-platform/`:

```bash
npm run lint
npm run typecheck
npm test
npm run db:test
npm run test:e2e
npm run build
```

Run in repository root:

```bash
npm run lint
npm run build
```

Expected: both applications PASS without sharing runtime files or environment variables.

- [ ] **Step 6: 最終スコープ確認を行う**

Confirm no implementation exists for:

- marketplace search.
- introductions.
- payments.
- referral rewards.
- star ratings.
- anonymous reviews.
- contract/invoice uploads.

- [ ] **Step 7: 最終コミットを作る**

```bash
git add .gitignore trust-platform/README.md trust-platform/docs
git commit -m "docs: add trust platform operations guide"
```

## 最終確認コマンド

```bash
cd trust-platform
npm run lint
npm run typecheck
npm test
npm run db:test
npm run test:e2e
npm run build
cd ..
npm run lint
npm run build
git status --short
```

Expected:

- 全テスト・ビルドが成功する。
- `trust-platform/` は独立して起動できる。
- 既存 `ai-work-log` に機能変更がない。
- ユーザーの未コミット変更が残っていても、本計画由来の未ステージ変更はない。

## 実装時に再確認する公式資料

- Next.js installed docs: `node_modules/next/dist/docs/`
- Supabase SSR client: https://supabase.com/docs/guides/auth/server-side/nextjs
- Supabase CLI/local development: https://supabase.com/docs/guides/local-development/cli/getting-started
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase rate limits: https://supabase.com/docs/guides/auth/rate-limits
- Resend with Next.js: https://resend.com/docs/send-with-nextjs
- Playwright: https://playwright.dev/docs/intro
