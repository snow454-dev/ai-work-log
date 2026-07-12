import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { VerifiedSolutionCard } from "./verified-solution-card";

const item = {
  id: "11111111-1111-4111-8111-111111111111",
  profileSlug: "aya-ai",
  providerDisplayName: "Aya AI",
  providerHeadline: "AI automation studio",
  providerCountryCode: "JP",
  publicTitle: "Invoice processing automation",
  publicServiceCategory: "Finance automation",
  verificationBadge: "company_domain_verified" as const,
  publicCompanyName: null,
  publicOutcomeMetricValue: 18,
  publicOutcomeMetricUnit: "hours/week",
  publicReferenceAvailable: true,
  publishedAt: "2026-07-12T00:00:00.000Z",
};

describe("VerifiedSolutionCard", () => {
  it("renders approved public fields and the detail link", () => {
    render(<VerifiedSolutionCard item={item} locale="en" />);

    expect(screen.getByText("Invoice processing automation")).toBeInTheDocument();
    expect(screen.getByText("18 hours/week")).toBeInTheDocument();
    expect(screen.queryByText("Client:")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View details/ })).toHaveAttribute(
      "href",
      "/solutions/aya-ai/11111111-1111-4111-8111-111111111111",
    );
  });
});
