import { describe, expect, it } from "vitest";

import { parsePublicSolutionSearchParams } from "./public-solution-search";

describe("parsePublicSolutionSearchParams", () => {
  it("normalizes a valid search", () => {
    expect(
      parsePublicSolutionSearchParams({
        q: "  invoice automation  ",
        category: "Finance automation",
        country: "jp",
        page: "2",
      }),
    ).toEqual({
      query: "invoice automation",
      formQuery: "invoice automation",
      category: "Finance automation",
      country: "JP",
      page: 2,
      limit: 24,
      offset: 24,
      errors: {},
    });
  });

  it("uses the first value for repeated URL parameters", () => {
    expect(
      parsePublicSolutionSearchParams({
        q: ["sales", "ignored"],
        country: ["gb", "us"],
      }),
    ).toMatchObject({ query: "sales", country: "GB" });
  });

  it("rejects an overlong query without silently searching a prefix", () => {
    const value = "x".repeat(101);

    expect(parsePublicSolutionSearchParams({ q: value })).toMatchObject({
      query: null,
      formQuery: value,
      errors: { query: "too_long" },
    });
  });

  it("falls back safely for invalid filters and pagination", () => {
    expect(
      parsePublicSolutionSearchParams({
        category: "x".repeat(121),
        country: "Japan",
        page: "1000",
      }),
    ).toEqual({
      query: null,
      formQuery: "",
      category: null,
      country: null,
      page: 1,
      limit: 24,
      offset: 0,
      errors: {
        category: "too_long",
        country: "invalid",
        page: "invalid",
      },
    });
  });
});
