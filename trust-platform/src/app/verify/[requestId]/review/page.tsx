import { cookies } from "next/headers";
import Link from "next/link";

import { PublicEvidencePreview } from "@/components/public-evidence-preview";
import { VerificationReviewForm } from "@/components/verification-review-form";
import { reviewerSessionCookieName } from "@/data/reviewer-auth";
import { getReviewerReviewContext } from "@/data/verifications";
import { hashOpaqueToken } from "@/lib/security/tokens";

export default async function ReviewerReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ requestId: string }>;
  searchParams: Promise<{ submitted?: string | string[] }>;
}) {
  const [{ requestId }, query] = await Promise.all([params, searchParams]);
  const submitted = Array.isArray(query.submitted)
    ? query.submitted[0]
    : query.submitted;

  if (submitted) {
    return <Submitted status={submitted} />;
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(
    reviewerSessionCookieName(requestId),
  )?.value;

  if (!sessionToken) {
    return <Unavailable />;
  }

  const context = await getReviewerReviewContext({
    requestId,
    sessionHash: hashOpaqueToken(sessionToken),
  });

  if (!context) {
    return <Unavailable />;
  }

  return (
    <main className="min-h-dvh bg-zinc-50 px-5 py-10 text-zinc-950">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">
            Company verification
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-950 text-balance">
            Verify {context.projectTitle}
          </h1>
          <p className="mt-3 text-zinc-600 text-pretty">
            Confirm the facts, choose any public fields, and submit. This is not
            a positive-review prompt; it is a factual company verification.
          </p>
          <div className="mt-8">
            <VerificationReviewForm context={context} />
          </div>
        </section>
        <PublicEvidencePreview context={context} />
      </div>
    </main>
  );
}

function Submitted({ status }: { status: string }) {
  return (
    <main className="min-h-dvh bg-zinc-50 px-5 py-10 text-zinc-950">
      <div className="mx-auto max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-950">
          Verification submitted
        </h1>
        <p className="mt-3 text-sm text-zinc-600">
          Thank you. The project is now marked as {status}.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white"
        >
          Back to Proofboard
        </Link>
      </div>
    </main>
  );
}

function Unavailable() {
  return (
    <main className="min-h-dvh bg-zinc-50 px-5 py-10 text-zinc-950">
      <div className="mx-auto max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-950">
          Review session unavailable
        </h1>
        <p className="mt-3 text-sm text-zinc-600 text-pretty">
          Your session may have expired. Reopen the verification link and request
          a fresh one-time code.
        </p>
      </div>
    </main>
  );
}
