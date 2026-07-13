import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getRequest: vi.fn(),
  inviteRequest: vi.fn(),
  updateStatus: vi.fn(),
  sendEmail: vi.fn(),
  revalidatePath: vi.fn(),
  hashEmail: vi.fn(() => "a".repeat(64)),
  consoleError: vi.fn(),
  env: {
    APP_URL: "https://jisseki.test",
    MAIL_TRANSPORT: "resend" as "resend" | "manual",
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/data/admin-beta-access", () => ({
  requireAdmin: mocks.requireAdmin,
  getAdminBetaAccessRequest: mocks.getRequest,
  inviteAdminBetaAccessRequest: mocks.inviteRequest,
  updateAdminBetaAccessRequestStatus: mocks.updateStatus,
}));
vi.mock("@/lib/email", () => ({
  getEmailTransport: () => ({ send: mocks.sendEmail }),
}));
vi.mock("@/lib/env", () => ({ env: mocks.env }));
vi.mock("@/lib/security/beta-invite", () => ({
  hashBetaInviteEmail: mocks.hashEmail,
}));

import { manageAdminBetaAccessRequest } from "./admin-beta-access";

const request = {
  id: "00000000-0000-4000-8000-000000000001",
  requester_name: "Takeshi Hayashi",
  work_email: "takeshi@example.com",
};

function form(operation: "review" | "invite" | "decline" | "close") {
  const data = new FormData();
  data.set("requestId", request.id);
  data.set("operation", operation);
  data.set("locale", "ja");
  return data;
}

describe("manageAdminBetaAccessRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(mocks.consoleError);
    mocks.env.MAIL_TRANSPORT = "resend";
    mocks.requireAdmin.mockResolvedValue(undefined);
    mocks.getRequest.mockResolvedValue(request);
    mocks.inviteRequest.mockResolvedValue({ ...request, status: "invited" });
    mocks.updateStatus.mockResolvedValue({ id: request.id });
    mocks.sendEmail.mockResolvedValue({ id: "email-1" });
  });

  it("uses the trusted server-side request email before granting access", async () => {
    const events: string[] = [];
    mocks.getRequest.mockImplementation(async () => {
      events.push("read-request");
      return request;
    });
    mocks.inviteRequest.mockImplementation(async () => {
      events.push("grant-access");
      return { ...request, status: "invited" };
    });
    mocks.sendEmail.mockImplementation(async () => {
      events.push("send-email");
      return { id: "email-1" };
    });

    await expect(
      manageAdminBetaAccessRequest({ ok: false }, form("invite")),
    ).resolves.toEqual({ ok: true, tone: "success", message: "invited" });

    expect(events).toEqual(["read-request", "grant-access", "send-email"]);
    expect(mocks.hashEmail).toHaveBeenCalledWith("takeshi@example.com");
    expect(mocks.inviteRequest).toHaveBeenCalledWith(request.id, "a".repeat(64));
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "takeshi@example.com",
        subject: "You are invited to the JISSEKI private beta",
      }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin");
  });

  it("keeps granted access when email delivery fails", async () => {
    mocks.sendEmail.mockRejectedValue(new Error("provider unavailable"));

    await expect(
      manageAdminBetaAccessRequest({ ok: false }, form("invite")),
    ).resolves.toEqual({
      ok: true,
      tone: "warning",
      message: "invited-email-failed",
      manualSignInUrl: "https://jisseki.test/sign-in?lang=ja",
    });

    expect(mocks.inviteRequest).toHaveBeenCalled();
    expect(mocks.consoleError).toHaveBeenCalledWith(
      "Beta access granted, but invitation email failed.",
      expect.any(Error),
    );
  });

  it("shows a manual sign-in URL when outbound mail is disabled", async () => {
    mocks.env.MAIL_TRANSPORT = "manual";

    await expect(
      manageAdminBetaAccessRequest({ ok: false }, form("invite")),
    ).resolves.toEqual({
      ok: true,
      tone: "warning",
      message: "invited-manual",
      manualSignInUrl: "https://jisseki.test/sign-in?lang=ja",
    });

    expect(mocks.inviteRequest).toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("updates non-invite statuses through the protected RPC", async () => {
    await expect(
      manageAdminBetaAccessRequest({ ok: false }, form("review")),
    ).resolves.toEqual({
      ok: true,
      tone: "success",
      message: "reviewing",
    });

    expect(mocks.updateStatus).toHaveBeenCalledWith(request.id, "reviewing");
    expect(mocks.getRequest).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("does not mutate requests when admin authorization fails", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("ADMIN_REQUIRED"));

    await expect(
      manageAdminBetaAccessRequest({ ok: false }, form("invite")),
    ).resolves.toEqual({ ok: false, tone: "error", message: "failed" });

    expect(mocks.getRequest).not.toHaveBeenCalled();
    expect(mocks.inviteRequest).not.toHaveBeenCalled();
  });
});
