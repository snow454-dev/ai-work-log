import { buildPublicEvidence } from "@/domain/public-evidence";
import type { ReviewContext } from "@/data/verifications";

export function PublicEvidencePreview({ context }: { context: ReviewContext }) {
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
        Public preview example
      </p>
      <h2 className="mt-2 text-xl font-semibold text-zinc-950">
        {preview.publicTitle}
      </h2>
      <dl className="mt-4 space-y-3 text-sm">
        <PreviewRow label="Service" value={preview.publicServiceCategory} />
        <PreviewRow label="Company" value={preview.publicCompanyName} />
        <PreviewRow
          label="Source"
          value={
            preview.publicSourcePlatformLabel ??
            preview.publicAcquisitionSource
          }
        />
        <PreviewRow label="Outcome" value={preview.publicOutcomeStatement} />
        <PreviewRow
          label="Metric"
          value={
            preview.publicOutcomeMetricValue !== null &&
            preview.publicOutcomeMetricUnit
              ? `${preview.publicOutcomeMetricValue} ${preview.publicOutcomeMetricUnit}`
              : null
          }
        />
      </dl>
      <p className="mt-4 text-xs text-zinc-500 text-pretty">
        The final public card will include only the fields you explicitly allow.
      </p>
    </aside>
  );
}

function PreviewRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium text-zinc-950">{value ?? "Hidden"}</dd>
    </div>
  );
}
