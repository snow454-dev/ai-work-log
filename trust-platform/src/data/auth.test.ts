import { describe, expect, it, vi } from "vitest";
import { requireUserId } from "./auth";

describe("requireUserId", () => {
  it("throws when claims do not contain a subject", async () => {
    const getClaims = vi
      .fn()
      .mockResolvedValue({ data: { claims: null }, error: null });

    await expect(
      requireUserId({ auth: { getClaims } } as never),
    ).rejects.toThrow("UNAUTHENTICATED");
  });

  it("returns the validated subject", async () => {
    const getClaims = vi
      .fn()
      .mockResolvedValue({ data: { claims: { sub: "user-123" } }, error: null });

    await expect(
      requireUserId({ auth: { getClaims } } as never),
    ).resolves.toBe("user-123");
  });
});
