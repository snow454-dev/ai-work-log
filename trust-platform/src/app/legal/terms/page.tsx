import type { Metadata } from "next";
import Link from "next/link";

import { LightLegalFooter } from "@/components/legal-footer";

export const metadata: Metadata = {
  title: "Beta Terms | Proofboard",
  description:
    "Private beta terms for using Proofboard to collect company-approved proof and consented reference requests.",
};

export default function TermsPage() {
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
            Beta Terms
          </h1>
          <p className="mt-4 leading-7 text-zinc-600 text-pretty">
            These beta terms set expectations for invited users testing
            Proofboard. They are lightweight operating terms for early customer
            use and should be replaced with counsel-reviewed production terms
            before a broad public launch.
          </p>

          <div className="mt-8 space-y-8">
            <TermsSection title="Private beta access">
              <p>
                Proofboard is currently invitation-only. Access may be limited,
                changed, paused, or revoked while the product is being tested
                and hardened.
              </p>
            </TermsSection>

            <TermsSection title="Accurate submissions">
              <p>
                Professionals should submit only completed work they are
                authorized to describe. Company reviewers should verify only
                facts they are authorized to approve on behalf of their
                organization.
              </p>
            </TermsSection>

            <TermsSection title="Consent-controlled proof">
              <p>
                Public proof should include only fields approved by the company
                reviewer and published by the professional. Do not use the
                product to expose confidential, personal, regulated, or
                contract-restricted information.
              </p>
            </TermsSection>

            <TermsSection title="Reference requests">
              <p>
                A public reference request is a request to the professional
                first. It does not create an obligation for the professional or
                company reviewer to respond, endorse, contract, hire, or provide
                a live reference call.
              </p>
            </TermsSection>

            <TermsSection title="Acceptable use">
              <p>
                Do not submit spam, impersonate another person, probe private
                reviewer details, overload public forms, upload misleading work
                claims, or use Proofboard to harass customers, reviewers,
                prospects, or professionals.
              </p>
            </TermsSection>

            <TermsSection title="No professional advice">
              <p>
                Proofboard is a workflow and reputation product. It does not
                provide legal, tax, employment, procurement, or financial advice
                and does not replace direct contracts or due diligence.
              </p>
            </TermsSection>

            <TermsSection title="Beta availability">
              <p>
                The service may contain defects, incomplete workflows, and
                temporary outages during beta. Use it with known design partners
                first, and keep separate records for critical business
                decisions.
              </p>
            </TermsSection>
          </div>
        </article>

        <LightLegalFooter />
      </div>
    </main>
  );
}

function TermsSection({
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
