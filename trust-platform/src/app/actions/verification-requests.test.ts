import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUserId: vi.fn(),
  createVerificationRequest: vi.fn(),
  recordVerificationDelivery: vi.fn(),
  claimSingleReminder: vi.fn(),
  revokeExpiredRequest: vi.fn(),
  sendEmail: vi.fn(),
  createOpaqueToken: vi.fn(),
  hashOpaqueToken: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("@/data/auth", () => ({
  getCurrentUserId: mocks.getCurrentUserId,
}));

vi.mock("@/data/verification-requests", () => ({
  createVerificationRequest: mocks.createVerificationRequest,
  recordVerificationDelivery: mocks.recordVerificationDelivery,
  claimSingleReminder: mocks.claimSingleReminder,
  revokeExpiredRequest: mocks.revokeExpiredRequest,
}));

vi.mock("@/lib/email", () => ({
  getEmailTransport: () => ({ send: mocks.sendEmail }),
}));

vi.mock("@/lib/security/tokens", () => ({
  createOpaqueToken: mocks.createOpaqueToken,
  hashOpaqueToken: mocks.hashOpaqueToken,
}));

import {
  replaceExpiredVerificationRequest,
  sendVerificationReminder,
  sendVerificationRequest,
} from "./verification-requests";

const requestContext = {
  id: "00000000-0000-4000-8000-000000000001",
  reviewerEmail: "ops@acme.com",
  professionalName: "Takeshi",
  projectTitle: "Reporting automation",
  expiresAt: "2026-06-25T00:00:00.000Z",
};

describe("sendVerificationRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUserId.mockResolvedValue("user-1");
    mocks.createOpaqueToken.mockReturnValue("plain-token");
    mocks.hashOpaqueToken.mockReturnValue("hashed-token");
    mocks.createVerificationRequest.mockResolvedValue(requestContext);
    mocks.recordVerificationDelivery.mockResolvedValue(undefined);
    mocks.sendEmail.mockResolvedValue({ id: "mail-1" });
  });

  it("rejects unauthorized users", async () => {
    mocks.getCurrentUserId.mockRejectedValue(new Error("UNAUTHENTICATED"));

    await expect(sendVerificationRequest("project-1")).rejects.toThrow(
      "UNAUTHENTICATED",
    );
    expect(mocks.createVerificationRequest).not.toHaveBeenCalled();
  });

  it("persists the request before sending email", async () => {
    const events: string[] = [];
    mocks.createVerificationRequest.mockImplementation(async () => {
      events.push("persist");
      return requestContext;
    });
    mocks.sendEmail.mockImplementation(async () => {
      events.push("send");
      return { id: "mail-1" };
    });

    const result = await sendVerificationRequest("project-1");

    expect(result.ok).toBe(true);
    expect(events).toEqual(["persist", "send"]);
    expect(mocks.createVerificationRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        projectId: "project-1",
        invitationTokenHash: "hashed-token",
      }),
    );
    expect(mocks.recordVerificationDelivery).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "verification_request.delivery_succeeded",
        providerMessageId: "mail-1",
      }),
    );
  });

  it("records delivery failure and returns a retry-safe error", async () => {
    mocks.sendEmail.mockRejectedValue(new Error("SMTP down"));

    const result = await sendVerificationRequest("project-1");

    expect(result).toEqual({
      ok: false,
      message:
        "The request was saved, but the email could not be sent. Please try again.",
    });
    expect(mocks.recordVerificationDelivery).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "verification_request.delivery_failed",
        requestId: requestContext.id,
      }),
    );
  });
});

describe("sendVerificationReminder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUserId.mockResolvedValue("user-1");
    mocks.createOpaqueToken.mockReturnValue("reminder-token");
    mocks.hashOpaqueToken.mockReturnValue("hashed-reminder-token");
    mocks.claimSingleReminder.mockResolvedValue(requestContext);
    mocks.recordVerificationDelivery.mockResolvedValue(undefined);
    mocks.sendEmail.mockResolvedValue({ id: "mail-reminder" });
  });

  it("allows one reminder through the atomic claim helper", async () => {
    const result = await sendVerificationReminder(requestContext.id);

    expect(result.ok).toBe(true);
    expect(mocks.claimSingleReminder).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: requestContext.id,
        invitationTokenHash: "hashed-reminder-token",
      }),
    );
  });

  it("rejects a second reminder when the claim helper rejects it", async () => {
    mocks.claimSingleReminder.mockRejectedValue(
      new Error("REMINDER_NOT_AVAILABLE"),
    );

    await expect(sendVerificationReminder(requestContext.id)).rejects.toThrow(
      "REMINDER_NOT_AVAILABLE",
    );
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });
});

describe("replaceExpiredVerificationRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUserId.mockResolvedValue("user-1");
    mocks.createOpaqueToken.mockReturnValue("replacement-token");
    mocks.hashOpaqueToken.mockReturnValue("hashed-replacement-token");
    mocks.createVerificationRequest.mockResolvedValue(requestContext);
    mocks.recordVerificationDelivery.mockResolvedValue(undefined);
    mocks.revokeExpiredRequest.mockResolvedValue(undefined);
    mocks.sendEmail.mockResolvedValue({ id: "mail-replacement" });
  });

  it("revokes the expired request before creating a replacement", async () => {
    const events: string[] = [];
    mocks.revokeExpiredRequest.mockImplementation(async () => {
      events.push("revoke");
    });
    mocks.createVerificationRequest.mockImplementation(async () => {
      events.push("create");
      return requestContext;
    });

    const result = await replaceExpiredVerificationRequest("project-1");

    expect(result.ok).toBe(true);
    expect(events).toEqual(["revoke", "create"]);
  });
});
