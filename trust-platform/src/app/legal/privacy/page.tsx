import type { Metadata } from "next";
import Link from "next/link";

import { LightLegalFooter } from "@/components/legal-footer";

export const metadata: Metadata = {
  title: "Beta Privacy Notice | Proofboard",
  description:
    "How Proofboard handles profile, project, company verification, and reference request data during the private beta.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-zinc-50 text-zinc-950">
      <div className="mx-auto max-w-3xl px-5 py-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold">
            Proofboard
          </Link>
          <p className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
            Private beta
          </p>
        </header>

        <article className="mt-10 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-medium text-zinc-500">
            Last updated June 28, 2026
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-zinc-950 text-balance">
            Beta Privacy Notice
          </h1>
          <p className="mt-4 leading-7 text-zinc-600 text-pretty">
            Proofboard helps independent professionals turn completed client
            work into company-approved proof and consented reference paths. This
            notice explains the data handling model for the private beta. It is
            intended for early customer testing and should be reviewed by
            counsel before broad public launch.
          </p>

          <div className="mt-8 space-y-8">
            <PolicySection title="What we collect">
              <p>
                We collect account details, professional profile information,
                project facts, company reviewer email addresses, reviewer
                verification responses, public proof settings, reference request
                submissions, audit events, and operational logs needed to run
                and secure the service.
              </p>
            </PolicySection>

            <PolicySection title="How we use data">
              <p>
                We use this data to authenticate users, create project records,
                send verification links, show only approved public proof, route
                reference requests to the professional first, prevent abuse, and
                support beta operations.
              </p>
            </PolicySection>

            <PolicySection title="What is public">
              <p>
                Public profiles show only fields that a company reviewer
                approved for sharing and that the professional chose to publish.
                Raw project notes, reviewer contact details, OTP tokens, and
                private request metadata are not shown on public proof pages.
              </p>
            </PolicySection>

            <PolicySection title="Reference requests">
              <p>
                When a prospect submits a reference request, the request is
                stored for the professional to review. The company reviewer is
                not contacted directly by the public form, and reviewer contact
                details are not exposed to the requester.
              </p>
            </PolicySection>

            <PolicySection title="Sharing and processors">
              <p>
                During beta, Proofboard may use infrastructure and email
                providers to host the product, store data, deliver transactional
                messages, and monitor reliability. We do not sell personal data.
              </p>
            </PolicySection>

            <PolicySection title="Retention and deletion">
              <p>
                Beta data is retained while the workspace is active and while it
                is needed for audit, security, or product operations. A
                participant may request deletion through the beta invitation
                channel, subject to legal, security, and audit constraints.
              </p>
            </PolicySection>

            <PolicySection title="Security model">
              <p>
                The beta uses authenticated workspaces, row-level access rules,
                scoped reviewer sessions, hashed verification tokens, audit
                events, and limited public fields. No beta system should be
                treated as a substitute for a signed contract, NDA, or formal
                reference agreement.
              </p>
            </PolicySection>
          </div>
        </article>

        <LightLegalFooter />
      </div>
    </main>
  );
}

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-zinc-950">{title}</h2>
      <div className="mt-2 leading-7 text-zinc-600 text-pretty">{children}</div>
    </section>
  );
}
