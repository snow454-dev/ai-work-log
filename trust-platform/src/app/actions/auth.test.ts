import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  invitationActive: vi.fn(),
  hashEmail: vi.fn(() => "b".repeat(64)),
  signInWithOtp: vi.fn(),
  env: {
    BETA_ALLOWED_EMAILS: "founder@example.com",
    BETA_ADDITIONAL_ALLOWED_EMAILS: undefined as string | undefined,
    ADMIN_ALLOWED_EMAILS: "hello@aisupports.cc",
    APP_URL: "https://jisseki.test",
  },
}));

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/data/admin-beta-access", () => ({
  isBetaInviteHashActive: mocks.invitationActive,
}));
vi.mock("@/lib/env", () => ({ env: mocks.env }));
vi.mock("@/lib/security/beta-invite", () => ({
  hashBetaInviteEmail: mocks.hashEmail,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      signInWithOtp: mocks.signInWithOtp,
      signOut: vi.fn(),
    },
  }),
}));

import { signIn } from "./auth";

function form(email: string) {
  const data = new FormData();
  data.set("email", email);
  data.set("next", "/dashboard");
  return data;
}

describe("signIn beta access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.invitationActive.mockResolvedValue(false);
    mocks.signInWithOtp.mockResolvedValue({ error: null });
  });

  it("lets an environment-approved admin request a magic link", async () => {
    await expect(signIn({}, form("hello@aisupports.cc"))).resolves.toEqual({
      sent: true,
    });

    expect(mocks.invitationActive).not.toHaveBeenCalled();
    expect(mocks.signInWithOtp).toHaveBeenCalled();
  });

  it("lets a database-invited applicant request a magic link", async () => {
    mocks.invitationActive.mockResolvedValue(true);

    await expect(signIn({}, form("invited@example.com"))).resolves.toEqual({
      sent: true,
    });

    expect(mocks.hashEmail).toHaveBeenCalledWith("invited@example.com");
    expect(mocks.invitationActive).toHaveBeenCalledWith("b".repeat(64));
    expect(mocks.signInWithOtp).toHaveBeenCalled();
  });

  it("fails closed for an email absent from configuration and database invites", async () => {
    await expect(signIn({}, form("unknown@example.com"))).resolves.toEqual({
      error:
        "This private beta is invite-only. Ask the JISSEKI team for access.",
    });

    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
  });
});
