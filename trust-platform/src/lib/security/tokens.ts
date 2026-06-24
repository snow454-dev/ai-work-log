import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env";

export function createOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashOpaqueToken(token: string): string {
  return createHash("sha256")
    .update(`${env.TOKEN_PEPPER}:${token}`)
    .digest("hex");
}

export function tokenHashesEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");

  return left.length === right.length && timingSafeEqual(left, right);
}
