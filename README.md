# ai-work-log ワークスペース

このリポジトリには複数のプロジェクトが同居しています。各プロジェクトの詳細は個別の README を参照してください。

## プロジェクト一覧

| プロジェクト | パス | 種別 | 概要 |
| --- | --- | --- | --- |
| ai-work-log (root) | `/` | Next.js アプリ | 音声入力で作業内容を記録し、Gemini AI でクライアント向け業務報告書を自動生成するツール。Supabase にデータを保存。 |
| JISSEKI (trust-platform) | `trust-platform/` | Next.js アプリ | フリーランス・独立専門家向けの実績証明プラットフォーム（private beta）。完了した案件を企業担当者が確認・承認し、公開可能な範囲だけを実績として公開できるサービス。 |
| Bing Maps Leads Extractor | `extensions/bing-maps-leads-extractor/` | Chrome 拡張機能 (社内利用) | Bing Maps の検索結果画面から事業者情報（店名・住所・電話番号・Web サイト等）を最大500件までCSV/Excelとして抽出するツール。外部サーバー・APIキー不要。 |

## 各プロジェクトの詳細

### ai-work-log (root)
- 技術: Next.js 16 / React 19 / Supabase / Google Generative AI (`@google/generative-ai`) / Tailwind CSS / motion
- 主なコード: `app/page.tsx`（記録・レポートUI）, `app/api/generate/`（AIレポート生成API）, `lib/supabase.ts`
- 起動: `npm run dev`

### JISSEKI (trust-platform)
- 技術: Next.js 16 / React 19 / Supabase (`@supabase/ssr`) / Resend・nodemailer / zod / Playwright・Vitest
- コアフロー: 専門家が完了案件を記録 → 企業ドメインメールへ検証依頼 → 企業レビュアーが事実確認・公開範囲を選択 → 専門家が承認された項目のみ公開
- 詳細は [`trust-platform/README.md`](trust-platform/README.md)、ベータ運用は [`trust-platform/docs/private-beta-runbook.md`](trust-platform/docs/private-beta-runbook.md) を参照
- 起動: `cd trust-platform && npm install && npm run dev`

### Bing Maps Leads Extractor
- Manifest V3 の Chrome 拡張機能。`storage` / `downloads` 権限のみ使用、外部通信なし
- 詳細は [`extensions/bing-maps-leads-extractor/README.md`](extensions/bing-maps-leads-extractor/README.md) を参照
- 開発確認: `cd extensions/bing-maps-leads-extractor && npm test && npm run check`

## 設計・仕様ドキュメント

`docs/superpowers/` にプロジェクトの計画・設計ドキュメントがあります。

- `docs/superpowers/plans/2026-06-23-bing-maps-leads-extractor-plan.md`
- `docs/superpowers/plans/2026-06-23-verified-reputation-platform-plan.md`
- `docs/superpowers/specs/2026-06-23-verified-reputation-platform-design.md`
- `docs/superpowers/specs/2026-06-23-bing-maps-leads-extractor-design.md`
- `docs/superpowers/specs/2026-06-30-beta-release-check-design.md`
- `docs/superpowers/specs/2026-06-30-beta-smoke-workflow-design.md`

---

## ai-work-log (root) 開発メモ

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

### Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

### Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

### Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
