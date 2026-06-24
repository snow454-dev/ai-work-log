import { describe, expect, it } from "vitest";

import { verificationInvitation, verificationOtp } from "./templates";

const secrets = {
  tokenHash: "token_hash_should_never_be_visible",
  otpHash: "otp_hash_should_never_be_visible",
  reviewerEmailHash: "reviewer_hash_should_never_be_visible",
  secretKey: "secret_key_should_never_be_visible",
};

describe("verificationInvitation", () => {
  it("includes human context and escapes HTML user input", () => {
    const message = verificationInvitation({
      to: "reviewer@example.com",
      professionalName: '<script>alert("pro")</script>',
      projectTitle: "<script>project</script>",
      invitationUrl: "https://example.com/verify/request-1?token=plain-token",
      expiresAt: "2026-06-25T00:00:00.000Z",
      isReminder: false,
      ...secrets,
    });

    expect(message.to).toBe("reviewer@example.com");
    expect(message.subject).toContain("Verify");
    expect(message.text).toContain("2026-06-25T00:00:00.000Z");
    expect(message.html).toContain("&lt;script&gt;project&lt;/script&gt;");
    expect(message.html).toContain(
      "&lt;script&gt;alert(&quot;pro&quot;)&lt;/script&gt;",
    );
    expect(`${message.text}\n${message.html}`).not.toContain(secrets.tokenHash);
    expect(`${message.text}\n${message.html}`).not.toContain(secrets.otpHash);
    expect(`${message.text}\n${message.html}`).not.toContain(
      secrets.reviewerEmailHash,
    );
    expect(`${message.text}\n${message.html}`).not.toContain(secrets.secretKey);
  });
});

describe("verificationOtp", () => {
  it("includes the OTP and expiration without leaking hashes", () => {
    const message = verificationOtp({
      to: "reviewer@example.com",
      professionalName: "Takeshi",
      projectTitle: "Automation",
      otp: "123456",
      expiresAt: "2026-06-25T00:10:00.000Z",
      ...secrets,
    });

    expect(message.text).toContain("123456");
    expect(message.text).toContain("2026-06-25T00:10:00.000Z");
    expect(message.html).toContain("123456");
    expect(`${message.text}\n${message.html}`).not.toContain(secrets.otpHash);
    expect(`${message.text}\n${message.html}`).not.toContain(secrets.secretKey);
  });
});
