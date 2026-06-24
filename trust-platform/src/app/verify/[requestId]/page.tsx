import Link from "next/link";

import { ReviewerOtpForm } from "@/components/reviewer-otp-form";
import {
  openReviewerInvitation,
  type ReviewerInvitation,
} from "@/data/reviewer-auth";
import { hashOpaqueToken } from "@/lib/security/tokens";

export default async function VerifyInvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ requestId: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const [{ requestId }, query] = await Promise.all([params, searchParams]);
  const token = Array.isArray(query.token) ? query.token[0] : query.token;

  if (!token) {
    return <InvalidInvitation />;
  }

  let invitation: ReviewerInvitation;

  try {
    invitation = await openReviewerInvitation({
      requestId,
      invitationTokenHash: hashOpaqueToken(token),
    });
  } catch {
    return <InvalidInvitation />;
  }

  return (
    <main className="min-h-dvh bg-zinc-50 px-5 py-10 text-zinc-950">
      <div className="mx-auto max-w-2xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-zinc-500">
          Company verification
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-zinc-950 text-balance">
          Review the evidence for {invitation.projectTitle}
        </h1>
        <p className="mt-3 text-zinc-600 text-pretty">
          {invitation.professionalName} asked you to verify a completed project.
          To protect your company and the professional, we will first send a
          one-time code to {maskEmail(invitation.reviewerEmail)}.
        </p>
        <div className="mt-6 rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600">
          <p>
            This invitation expires at{" "}
            <span className="font-medium text-zinc-950">
              {new Date(invitation.expiresAt).toISOString()}
            </span>
            .
          </p>
        </div>
        <div className="mt-6">
          <ReviewerOtpForm invitation={invitation} token={token} />
        </div>
      </div>
    </main>
  );
}

function InvalidInvitation() {
  return (
    <main className="min-h-dvh bg-zinc-50 px-5 py-10 text-zinc-950">
      <div className="mx-auto max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-950">
          This verification link is unavailable
        </h1>
        <p className="mt-3 text-sm text-zinc-600 text-pretty">
          The link may be expired, revoked, or already used. Ask the
          professional to send a fresh verification request.
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

function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  const visible = local.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(local.length - 2, 2))}@${domain}`;
}
