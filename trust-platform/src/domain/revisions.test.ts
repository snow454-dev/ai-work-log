import { describe, expect, it } from "vitest";

import { nextRevisionNumber, revisionContentHash } from "./revisions";

describe("revisionContentHash", () => {
  it("hashes equivalent nested objects identically regardless of key order", () => {
    const first = {
      title: "Automation",
      nested: {
        z: ["b", { second: 2, first: 1 }],
        a: true,
      },
    };

    const second = {
      nested: {
        a: true,
        z: ["b", { first: 1, second: 2 }],
      },
      title: "Automation",
    };

    expect(revisionContentHash(first)).toBe(revisionContentHash(second));
  });

  it("distinguishes different Date values", () => {
    const first = revisionContentHash({
      projectStart: new Date("2026-01-01T00:00:00.000Z"),
    });
    const second = revisionContentHash({
      projectStart: new Date("2026-02-01T00:00:00.000Z"),
    });

    expect(first).not.toBe(second);
  });

  it("rejects unsupported objects instead of hashing them as empty objects", () => {
    const unsupportedValue = new Map([["source", "upwork"]]) as unknown as
      Parameters<typeof revisionContentHash>[0];

    expect(() => revisionContentHash(unsupportedValue)).toThrow(
      "plain objects",
    );
  });
});

describe("nextRevisionNumber", () => {
  it("starts at one", () => {
    expect(nextRevisionNumber([])).toBe(1);
  });

  it("returns one higher than the greatest existing revision", () => {
    expect(nextRevisionNumber([1, 3, 2])).toBe(4);
  });
});
