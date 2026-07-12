import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createBetaAccessRequest: vi.fn(),
  sendEmail: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  consoleError: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/data/beta-access-requests", () => ({
  createBetaAccessRequest: mocks.createBetaAccessRequest,
}));

vi.mock("@/lib/email", () => ({
  getEmailTransport: () => ({ send: mocks.sendEmail }),
}));

import { submitBetaAccessRequest } from "./beta-access-requests";

function validFormData() {
  const formData = new FormData();
  formData.set("intent", "developer");
  formData.set("requesterName", "Takeshi Hayashi");
  formData.set("workEmail", "takeshi@example.com");
  formData.set("companyName", "AI Supports");
  formData.set("role", "Founder");
  formData.set(
    "useCase",
    "I want to validate one completed AI automation project with a client.",
  );
  formData.set("sourcePath", "/beta-access");
  formData.set("consentConfirmed", "on");
  return formData;
}

describe("submitBetaAccessRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.consoleError.mockReset();
    vi.spyOn(console, "error").mockImplementation(mocks.consoleError);

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable_live";
    process.env.APP_URL = "https://jisseki.test";
    process.env.TOKEN_PEPPER = "0123456789abcdef0123456789abcdef";
    process.env.OTP_PEPPER = "abcdef0123456789abcdef0123456789";
    process.env.MAIL_TRANSPORT = "resend";
    process.env.RESEND_API_KEY = "re_test_123";
    process.env.MAIL_FROM = "JISSEKI <no-reply@jisseki.test>";
    process.env.BETA_ACCESS_NOTIFY_EMAIL = "admin@jisseki.test";

    mocks.createBetaAccessRequest.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000001",
    });
    mocks.sendEmail.mockResolvedValue({ id: "email-1" });
  });

  it("persists a beta request before notifying the admin", async () => {
    const events: string[] = [];
    mocks.createBetaAccessRequest.mockImplementation(async () => {
      events.push("persist");
      return { id: "00000000-0000-4000-8000-000000000001" };
    });
    mocks.sendEmail.mockImplementation(async () => {
      events.push("notify");
      return { id: "email-1" };
    });

    await expect(
      submitBetaAccessRequest("en", {}, validFormData()),
    ).rejects.toThrow("NEXT_REDIRECT:/beta-access?intent=developer&submitted=1");

    expect(events).toEqual(["persist", "notify"]);
    expect(mocks.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "admin@jisseki.test",
        subject: "New JISSEKI beta access request: Takeshi Hayashi",
      }),
    );
  });

  it("still redirects to success when admin notification fails", async () => {
    mocks.sendEmail.mockRejectedValue(new Error("Resend unavailable"));

    await expect(
      submitBetaAccessRequest("en", {}, validFormData()),
    ).rejects.toThrow("NEXT_REDIRECT:/beta-access?intent=developer&submitted=1");

    expect(mocks.createBetaAccessRequest).toHaveBeenCalled();
    expect(mocks.consoleError).toHaveBeenCalledWith(
      "Unable to send beta access notification.",
      expect.any(Error),
    );
  });

  it("skips notification when no admin recipient is configured", async () => {
    delete process.env.BETA_ACCESS_NOTIFY_EMAIL;

    await expect(
      submitBetaAccessRequest("en", {}, validFormData()),
    ).rejects.toThrow("NEXT_REDIRECT:/beta-access?intent=developer&submitted=1");

    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });
});
