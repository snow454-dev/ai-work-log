import "server-only";

import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env";

export function createOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtp(otp: string): string {
  return createHmac("sha256", env.OTP_PEPPER).update(otp).digest("hex");
}

export function otpHashesEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");

  return left.length === right.length && timingSafeEqual(left, right);
}
