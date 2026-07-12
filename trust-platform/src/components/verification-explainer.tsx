import type { Locale } from "@/lib/i18n";

const copy: Record<Locale, { eyebrow: string; title: string; body: string; points: string[] }> = {
  en: {
    eyebrow: "Proof before promises",
    title: "Every result starts with company-approved evidence.",
    body: "JISSEKI separates a provider claim from the fields a company-domain reviewer approved for publication. Mailbox control is evidence of review access, not formal legal endorsement by the company.",
    points: [
      "Company-domain mailbox verification",
      "Client-controlled public fields",
      "Hashed invitation and session tokens",
    ],
  },
  ja: {
    eyebrow: "約束より先に、実績を見る",
    title: "すべての検索結果は、企業が公開を承認した実績から始まります。",
    body: "JISSEKIは、提供者の自己申告と、企業ドメインの確認担当者が公開を承認した項目を分けて表示します。メールボックスの確認はレビュー権限の証明であり、企業による法的な推薦を意味しません。",
    points: [
      "企業ドメインのメール確認",
      "公開項目は顧客企業が選択",
      "招待・セッショントークンはハッシュ保存",
    ],
  },
};

export function VerificationExplainer({ locale }: { locale: Locale }) {
  const content = copy[locale];

  return (
    <section className="grid border-y border-white/15 bg-[#151719] text-white lg:grid-cols-[1.2fr_0.8fr]">
      <div className="border-b border-white/15 p-8 lg:border-b-0 lg:border-r lg:p-12">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d7ff45]">{content.eyebrow}</p>
        <h2 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.04em] [font-family:var(--font-display)] md:text-5xl">
          {content.title}
        </h2>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-300">{content.body}</p>
      </div>
      <ol className="divide-y divide-white/15">
        {content.points.map((point, index) => (
          <li key={point} className="flex min-h-24 items-center gap-5 px-8 py-5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-emerald-950 text-sm font-black text-emerald-300">
              {index + 1}
            </span>
            <span className="text-sm font-semibold text-zinc-200">{point}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
