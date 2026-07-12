export type PublicSolutionSearchParams = {
  q?: string | string[];
  category?: string | string[];
  country?: string | string[];
  page?: string | string[];
};

export type PublicSolutionSearchError =
  | "too_long"
  | "invalid";

export type ParsedPublicSolutionSearch = {
  query: string | null;
  formQuery: string;
  category: string | null;
  country: string | null;
  page: number;
  limit: 24;
  offset: number;
  errors: Partial<
    Record<"query" | "category" | "country" | "page", PublicSolutionSearchError>
  >;
};

function firstValue(value?: string | string[]): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export function parsePublicSolutionSearchParams(
  params: PublicSolutionSearchParams,
): ParsedPublicSolutionSearch {
  const errors: ParsedPublicSolutionSearch["errors"] = {};
  const formQuery = firstValue(params.q);
  const rawCategory = firstValue(params.category);
  const rawCountry = firstValue(params.country);
  const rawPage = firstValue(params.page);

  let query: string | null = formQuery || null;
  if (formQuery.length > 100) {
    errors.query = "too_long";
    query = null;
  }

  let category: string | null = rawCategory || null;
  if (rawCategory.length > 120) {
    errors.category = "too_long";
    category = null;
  }

  let country: string | null = rawCountry.toUpperCase() || null;
  if (rawCountry && !/^[a-z]{2}$/i.test(rawCountry)) {
    errors.country = "invalid";
    country = null;
  }

  let page = 1;
  if (rawPage) {
    const parsedPage = Number(rawPage);
    if (/^\d+$/.test(rawPage) && parsedPage >= 1 && parsedPage <= 100) {
      page = parsedPage;
    } else {
      errors.page = "invalid";
    }
  }

  return {
    query,
    formQuery,
    category,
    country,
    page,
    limit: 24,
    offset: (page - 1) * 24,
    errors,
  };
}
