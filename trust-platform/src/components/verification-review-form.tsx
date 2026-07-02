"use client";

import { useActionState } from "react";

import {
  submitReviewerVerification,
  type ReviewerVerificationState,
} from "@/app/actions/reviewer-verification";
import type { ReviewContext } from "@/data/verifications";
import type { Locale } from "@/lib/i18n";

const initialState: ReviewerVerificationState = {};

const verificationReviewCopy: Record<
  Locale,
  {
    confirmTitle: string;
    confirmDescription: string;
    projectExisted: string;
    sourceAccurate: string;
    roleAccurate: string;
    outcomeAccurate: string;
    metricAccurate: string;
    referenceTitle: string;
    referenceDescription: string;
    rehireLabel: string;
    yes: string;
    maybe: string;
    no: string;
    sharingLabel: string;
    sharePublic: string;
    referenceOnly: string;
    notNow: string;
    openToReferenceRequests: string;
    attributionTitle: string;
    attributionDescription: string;
    reviewerName: string;
    reviewerJobTitle: string;
    comment: string;
    visibilityTitle: string;
    visibilityDescription: string;
    companyName: string;
    acquisitionSource: string;
    reviewerNameVisibility: string;
    reviewerJobTitleVisibility: string;
    projectPeriod: string;
    outcomeStatement: string;
    outcomeMetric: string;
    reviewerComment: string;
    rehireResponse: string;
    consent: string;
    submitting: string;
    submit: string;
    preferNot: string;
    messages: Record<string, string>;
  }
> = {
  en: {
    confirmTitle: "Confirm the facts",
    confirmDescription:
      "Only approve facts you can stand behind on behalf of your company.",
    projectExisted: "This project existed",
    sourceAccurate: "The acquisition source is accurate",
    roleAccurate: "The role is accurate",
    outcomeAccurate: "The outcome statement is accurate",
    metricAccurate: "The outcome metric is accurate",
    referenceTitle: "Reference preference",
    referenceDescription:
      "This is separate from whether the facts are accurate. JISSEKI never exposes your email publicly.",
    rehireLabel: "Would you work with this professional again?",
    yes: "Yes",
    maybe: "Maybe",
    no: "No",
    sharingLabel: "How may this verification be used?",
    sharePublic: "They may show approved fields publicly",
    referenceOnly: "Reference requests only; do not publish as proof",
    notNow: "Not now",
    openToReferenceRequests:
      "I am open to structured future reference requests through JISSEKI",
    attributionTitle: "Optional attribution",
    attributionDescription:
      "Leave these blank if you do not want your name or title shown.",
    reviewerName: "Your name",
    reviewerJobTitle: "Your job title",
    comment: "Comment",
    visibilityTitle: "Public visibility",
    visibilityDescription:
      "Choose exactly which approved fields can appear on the professional's public proof card.",
    companyName: "Company name",
    acquisitionSource: "Acquisition source",
    reviewerNameVisibility: "Reviewer name",
    reviewerJobTitleVisibility: "Reviewer job title",
    projectPeriod: "Project period",
    outcomeStatement: "Outcome statement",
    outcomeMetric: "Outcome metric",
    reviewerComment: "Reviewer comment",
    rehireResponse: "Rehire response",
    consent:
      "I confirm I am authorized to submit this verification and consent to the selected public fields.",
    submitting: "Submitting...",
    submit: "Submit verification",
    preferNot: "Prefer not to say",
    messages: {},
  },
  ja: {
    confirmTitle: "事実を確認する",
    confirmDescription:
      "会社を代表して確認できる事実だけを承認してください。",
    projectExisted: "この案件は実在した",
    sourceAccurate: "獲得経路は正しい",
    roleAccurate: "役割の記載は正しい",
    outcomeAccurate: "成果の説明は正しい",
    metricAccurate: "成果指標は正しい",
    referenceTitle: "紹介・推薦の希望",
    referenceDescription:
      "事実が正しいかどうかとは別の設定です。JISSEKIがあなたのメールアドレスを公開することはありません。",
    rehireLabel: "このプロフェッショナルとまた仕事をしたいですか？",
    yes: "はい",
    maybe: "場合による",
    no: "いいえ",
    sharingLabel: "この確認結果をどのように使ってよいですか？",
    sharePublic: "承認した項目を公開プロフィールに表示してよい",
    referenceOnly: "紹介依頼のみ可。公開実績としては掲載しない",
    notNow: "今回は許可しない",
    openToReferenceRequests:
      "JISSEKI経由の構造化された将来の紹介依頼を受け付けてもよい",
    attributionTitle: "任意の署名情報",
    attributionDescription:
      "氏名や役職を表示したくない場合は空欄のままで構いません。",
    reviewerName: "あなたの氏名",
    reviewerJobTitle: "あなたの役職",
    comment: "コメント",
    visibilityTitle: "公開範囲",
    visibilityDescription:
      "プロフェッショナルの公開実績カードに表示してよい承認済み項目を選んでください。",
    companyName: "企業名",
    acquisitionSource: "獲得経路",
    reviewerNameVisibility: "確認者名",
    reviewerJobTitleVisibility: "確認者の役職",
    projectPeriod: "案件期間",
    outcomeStatement: "成果の説明",
    outcomeMetric: "成果指標",
    reviewerComment: "確認者コメント",
    rehireResponse: "再依頼の意向",
    consent:
      "私はこの確認を提出する権限があり、選択した項目の公開に同意します。",
    submitting: "送信中...",
    submit: "確認結果を送信",
    preferNot: "回答しない",
    messages: {
      "Fix the highlighted fields.": "赤字の項目を修正してください。",
      "Unable to submit this verification. Request a fresh link.":
        "確認結果を送信できませんでした。新しいリンクを依頼してください。",
    },
  },
};

export function VerificationReviewForm({
  context,
  locale,
}: {
  context: ReviewContext;
  locale: Locale;
}) {
  const action = submitReviewerVerification.bind(null, context.requestId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const copy = verificationReviewCopy[locale];
  const message =
    state.message ? copy.messages[state.message] ?? state.message : undefined;

  return (
    <form action={formAction} className="space-y-8" aria-busy={pending}>
      {context.outcomeMetricValue !== null ? (
        <input type="hidden" name="hasOutcomeMetric" value="on" />
      ) : null}

      <section className="space-y-4">
        <SectionTitle
          title={copy.confirmTitle}
          description={copy.confirmDescription}
        />
        <Checkbox name="projectExisted" label={copy.projectExisted} defaultChecked />
        <Checkbox
          name="sourceAccurate"
          label={copy.sourceAccurate}
          defaultChecked
        />
        <Checkbox name="roleAccurate" label={copy.roleAccurate} defaultChecked />
        <Checkbox
          name="outcomeAccurate"
          label={copy.outcomeAccurate}
          defaultChecked
        />
        {context.outcomeMetricValue !== null ? (
          <Checkbox
            name="metricAccurate"
            label={copy.metricAccurate}
            defaultChecked
          />
        ) : null}
      </section>

      <section className="space-y-4">
        <SectionTitle
          title={copy.referenceTitle}
          description={copy.referenceDescription}
        />
        <Select
          name="rehireResponse"
          label={copy.rehireLabel}
          options={[
            ["yes", copy.yes],
            ["maybe", copy.maybe],
            ["no", copy.no],
          ]}
          preferNot={copy.preferNot}
        />
        <Select
          name="sharingPreference"
          label={copy.sharingLabel}
          options={[
            ["share_public_profile", copy.sharePublic],
            ["open_to_reference_request", copy.referenceOnly],
            ["not_now", copy.notNow],
          ]}
          required
          preferNot={copy.preferNot}
        />
        <Checkbox
          name="openToReferenceRequests"
          label={copy.openToReferenceRequests}
        />
      </section>

      <section className="space-y-4">
        <SectionTitle
          title={copy.attributionTitle}
          description={copy.attributionDescription}
        />
        <Field name="reviewerName" label={copy.reviewerName} />
        <Field name="reviewerJobTitle" label={copy.reviewerJobTitle} />
        <div>
          <label
            htmlFor="reviewerComment"
            className="block text-sm font-medium text-zinc-900"
          >
            {copy.comment}
          </label>
          <textarea
            id="reviewerComment"
            name="reviewerComment"
            rows={4}
            className="mt-2 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-950 shadow-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle
          title={copy.visibilityTitle}
          description={copy.visibilityDescription}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Checkbox name="showCompanyName" label={copy.companyName} />
          <Checkbox name="showAcquisitionSource" label={copy.acquisitionSource} />
          <Checkbox name="showReviewerName" label={copy.reviewerNameVisibility} />
          <Checkbox
            name="showReviewerJobTitle"
            label={copy.reviewerJobTitleVisibility}
          />
          <Checkbox name="showProjectPeriod" label={copy.projectPeriod} />
          <Checkbox name="showOutcomeStatement" label={copy.outcomeStatement} />
          {context.outcomeMetricValue !== null ? (
            <Checkbox name="showOutcomeMetric" label={copy.outcomeMetric} />
          ) : null}
          <Checkbox name="showReviewerComment" label={copy.reviewerComment} />
          <Checkbox name="showRehireResponse" label={copy.rehireResponse} />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <Checkbox
          name="consentConfirmed"
          label={copy.consent}
        />
      </section>

      {message ? (
        <p className="text-sm text-red-700" aria-live="polite">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {pending ? copy.submitting : copy.submit}
      </button>
    </form>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-950 text-balance">
        {title}
      </h2>
      <p className="mt-1 text-sm text-zinc-600 text-pretty">{description}</p>
    </div>
  );
}

function Checkbox({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex gap-3 text-sm text-zinc-700">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 rounded border-zinc-300 text-zinc-950"
      />
      <span>{label}</span>
    </label>
  );
}

function Field({ name, label }: { name: string; label: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-zinc-900">
        {label}
      </label>
      <input
        id={name}
        name={name}
        className="mt-2 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-950 shadow-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
      />
    </div>
  );
}

function Select({
  name,
  label,
  options,
  required,
  preferNot,
}: {
  name: string;
  label: string;
  options: readonly (readonly [string, string])[];
  required?: boolean;
  preferNot: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-zinc-900">
        {label}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue={required ? options[0]?.[0] : ""}
        className="mt-2 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-950 shadow-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
      >
        {!required ? <option value="">{preferNot}</option> : null}
        {options.map(([value, optionLabel]) => (
          <option key={value} value={value}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}
