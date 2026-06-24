import { describe, expect, it } from "vitest";

import { reviewerSessionCookieName } from "./reviewer-auth";

describe("reviewerSessionCookieName", () => {
  it("scopes the reviewer session cookie to a verification request", () => {
    expect(
      reviewerSessionCookieName("00000000-0000-4000-8000-000000000001"),
    ).toBe("vrp_review_00000000-0000-4000-8000-000000000001");
  });
});
