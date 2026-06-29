import { buildPublicEvidence } from "@/domain/public-evidence";
import type { ReviewContext } from "@/data/verifications";
import type { Locale } from "@/lib/i18n";

const previewCopy: Record<
  Locale,
  {
    eyebrow: string;
    service: string;
    company: string;
    source: string;
    outcome: string;
    metric: string;
    footer: string;
    hidden: string;
  }
> = {
  en: {
    eyebrow: "Public preview example",
    service: "Service",
    company: "Company",
    source: "Source",
    outcome: "Outcome",
    metric: "Metric",
    footer:
      "The final public card will include only the fields you explicitly allow.",
    hidden: "Hidden",
  },
  ja: {
    eyebrow: "公開プレビュー例",
    service: "サービス",
    company: "企業",
    source: "経路",
    outcome: "成果",
    metric: "指標",
    footer: "最終的な公開カードには、あなたが明示的に許可した項目だけが表示されます。",
    hidden: "非表示",
  },
};

export function PublicEvidencePreview({
  context,
  locale,
}: {
  context: ReviewContext;
  locale: Locale;
}) {
  const copy = previewCopy[locale];
  const preview = buildPublicEvidence({
    revision: {
      title: context.projectTitle,
      serviceCategory: context.serviceCategory,
      acquisitionSource: context.acquisitionSource,
      sourcePlatformLabel: context.sourcePlatformLabel,
      companyName: context.companyName,
      projectStart: context.projectStart,
      projectEnd: context.projectEnd,
      outcomeStatement: context.outcomeStatement,
      outcomeMetricValue: context.outcomeMetricValue,
      outcomeMetricUnit: context.outcomeMetricUnit,
    },
    verification: {
      reviewerName: null,
      reviewerJobTitle: null,
      reviewerComment: null,
      rehireResponse: null,
      openToReferenceRequests: false,
      showCompanyName: true,
      showAcquisitionSource: true,
      showReviewerName: false,
      showReviewerJobTitle: false,
      showProjectPeriod: true,
      showOutcomeStatement: true,
      showOutcomeMetric: context.outcomeMetricValue !== null,
      showReviewerComment: false,
      showRehireResponse: false,
    },
  });

  return (
    <aside className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
      <p className="text-xs font-medium uppercase text-zinc-500">
        {copy.eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-zinc-950">
        {preview.publicTitle}
      </h2>
      <dl className="mt-4 space-y-3 text-sm">
        <PreviewRow
          label={copy.service}
          value={preview.publicServiceCategory}
          hiddenLabel={copy.hidden}
        />
        <PreviewRow
          label={copy.company}
          value={preview.publicCompanyName}
          hiddenLabel={copy.hidden}
        />
        <PreviewRow
          label={copy.source}
          value={
            preview.publicSourcePlatformLabel ??
            preview.publicAcquisitionSource
          }
          hiddenLabel={copy.hidden}
        />
        <PreviewRow
          label={copy.outcome}
          value={preview.publicOutcomeStatement}
          hiddenLabel={copy.hidden}
        />
        <PreviewRow
          label={copy.metric}
          value={
            preview.publicOutcomeMetricValue !== null &&
            preview.publicOutcomeMetricUnit
              ? `${preview.publicOutcomeMetricValue} ${preview.publicOutcomeMetricUnit}`
              : null
          }
          hiddenLabel={copy.hidden}
        />
      </dl>
      <p className="mt-4 text-xs text-zinc-500 text-pretty">
        {copy.footer}
      </p>
    </aside>
  );
}

function PreviewRow({
  label,
  value,
  hiddenLabel,
}: {
  label: string;
  value: string | null;
  hiddenLabel: string;
}) {
  return (
    <div>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium text-zinc-950">{value ?? hiddenLabel}</dd>
    </div>
  );
}
