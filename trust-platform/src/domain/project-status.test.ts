import { describe, expect, it } from "vitest";

import { canTransition } from "./project-status";

describe("canTransition", () => {
  it.each([
    ["draft", "sent"],
    ["sent", "viewed"],
    ["viewed", "verified"],
    ["verified", "published"],
    ["published", "withdrawn"],
    ["published", "disputed"],
  ] as const)("allows %s -> %s", (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  it.each([
    ["declined", "published"],
    ["expired", "verified"],
    ["disputed", "published"],
    ["published", "verified"],
  ] as const)("rejects %s -> %s", (from, to) => {
    expect(canTransition(from, to)).toBe(false);
  });
});
