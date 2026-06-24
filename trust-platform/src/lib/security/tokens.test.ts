import { describe, expect, it } from "vitest";

import { createOtp, hashOtp, otpHashesEqual } from "./otp";
import {
  createOpaqueToken,
  hashOpaqueToken,
  tokenHashesEqual,
} from "./tokens";

describe("opaque tokens", () => {
  it("creates a 256-bit opaque token and stable hash", () => {
    const token = createOpaqueToken();

    expect(Buffer.from(token, "base64url")).toHaveLength(32);
    expect(hashOpaqueToken(token)).toBe(hashOpaqueToken(token));
    expect(tokenHashesEqual(hashOpaqueToken(token), hashOpaqueToken(token))).toBe(
      true,
    );
    expect(tokenHashesEqual(hashOpaqueToken(token), hashOpaqueToken("other"))).toBe(
      false,
    );
  });
});

describe("otp", () => {
  it("creates a six digit OTP and keyed hash", () => {
    const otp = createOtp();

    expect(otp).toMatch(/^\d{6}$/);
    expect(hashOtp(otp)).toHaveLength(64);
    expect(otpHashesEqual(hashOtp(otp), hashOtp(otp))).toBe(true);
    expect(otpHashesEqual(hashOtp(otp), hashOtp("000000"))).toBe(false);
  });
});
