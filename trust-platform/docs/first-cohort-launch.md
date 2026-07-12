# JISSEKI first cohort launch guide

This guide is for the first 3-5 invited AI developers and company buyers. Keep the cohort small until one complete trust loop works in production.

## Release state

Production beta is considered ready to invite the first cohort when all of these are true:

- [ ] `/api/health` returns `ok: true`.
- [ ] `npm run beta:smoke -- --url https://jisseki.io` passes.
- [ ] `BETA_ALLOWED_EMAILS` and `BETA_ADDITIONAL_ALLOWED_EMAILS` contain only invited professional account emails.
- [ ] `BETA_ACCESS_NOTIFY_EMAIL` points to the inbox that will review incoming `/beta-access` requests.
- [ ] Supabase Auth redirect URLs include `https://jisseki.io/auth/confirm`.
- [ ] The first company reviewer already expects the verification request.

Note: Vercel encrypted or sensitive environment variables may appear empty when pulled locally. Treat the deployed `/api/health` result and deployed smoke test as the source of truth for production readiness.

## Pick the first cohort

Start with people who can complete the loop quickly:

1. AI developer has one completed B2B AI project.
2. Company reviewer has a real company-domain email.
3. Reviewer expects the request before the link is sent.
4. No confidential customer data is needed to describe the project.
5. Developer agrees to give feedback within 24-48 hours.

Avoid regulated data, cold reviewer outreach, anonymous marketplace-only work, and projects where the company cannot confirm facts.

## Review beta access requests

New submissions are emailed to `BETA_ACCESS_NOTIFY_EMAIL` when that environment variable is configured. Use Supabase SQL editor or table view with an admin/service-role session for the source of truth. Do not expose this table in the public app.

```sql
select
  id,
  intent,
  requester_name,
  work_email,
  company_name,
  role,
  left(use_case, 180) as use_case_preview,
  status,
  created_at
from public.beta_access_requests
order by created_at desc
limit 25;
```

Move a request into review:

```sql
update public.beta_access_requests
set status = 'reviewing',
    updated_at = now()
where id = 'REQUEST_ID';
```

After adding the requester email to `BETA_ALLOWED_EMAILS` or `BETA_ADDITIONAL_ALLOWED_EMAILS`, mark it invited:

```sql
update public.beta_access_requests
set status = 'invited',
    updated_at = now()
where id = 'REQUEST_ID';
```

If the request is not a fit:

```sql
update public.beta_access_requests
set status = 'declined',
    updated_at = now()
where id = 'REQUEST_ID';
```

## Add an invited professional

1. Open Vercel project settings for production environment variables.
2. Prefer editing `BETA_ALLOWED_EMAILS` when you know the full current list.
3. If the encrypted current value is not readable, set or edit `BETA_ADDITIONAL_ALLOWED_EMAILS` instead.
4. Add the exact work email used for sign-in.
5. Redeploy only if the platform requires it for env changes.
6. Run:

   ```bash
   npm run beta:smoke -- --url https://jisseki.io
   ```

## Message templates

### AI developer invite

```text
JISSEKIのプライベートβに招待します。

まずは完了済みAI案件を1件だけ登録してください。
その後、企業ドメインの確認担当者に事実確認リンクを送ります。

ログイン:
https://jisseki.io/sign-in?lang=ja

最初の目標:
1. プロフィール作成
2. 完了案件1件の登録
3. 企業確認の送信
4. 承認された項目だけ公開

注意:
機密情報、個人情報、未許可の顧客情報は入力しないでください。
```

### Company reviewer heads-up

```text
JISSEKIで、過去に完了したAI案件の事実確認をお願いする予定です。

目的は「良いレビューを書いてもらうこと」ではなく、案件が実在し、公開してよい項目を企業側で選ぶことです。
確認担当者のメールアドレスは公開されません。

確認する主な内容:
- 案件が実在したか
- 対応範囲や成果の表現が正しいか
- 公開してよい項目
- 将来の紹介依頼をJISSEKI経由で受けてもよいか

不明点があれば、承認せずに止めてください。
```

## First production loop

Run this once before broadening the cohort:

1. Invited professional signs in.
2. Professional creates or updates profile.
3. Professional creates one completed AI project.
4. Professional sends company verification.
5. Reviewer opens the link and completes OTP/session flow.
6. Reviewer approves only safe public fields.
7. Professional publishes proof.
8. A test prospect submits a reference request from the public profile.
9. Professional accepts or declines the request from the dashboard.
10. Record feedback and do not invite the next user until the loop is clear.

## Stop conditions

Pause new invites if any of these happen:

- `/api/health` is not `ok: true`.
- A reviewer sees data they should not see.
- A public proof page exposes non-approved fields.
- A beta participant cannot understand what to do next.
- A company asks for legal/security review before continuing.

When paused, keep existing proof private, preserve audit logs, and fix the issue before adding more users.
