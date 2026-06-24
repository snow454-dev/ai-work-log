import { createHash } from "node:crypto";

type RevisionHashInput =
  | string
  | number
  | boolean
  | null
  | Date
  | readonly RevisionHashInput[]
  | { readonly [key: string]: RevisionHashInput | undefined };

type NormalizedRevisionHashInput =
  | string
  | number
  | boolean
  | null
  | readonly NormalizedRevisionHashInput[]
  | { readonly [key: string]: NormalizedRevisionHashInput };

function normalizeForStableJson(
  value: RevisionHashInput,
): NormalizedRevisionHashInput {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(normalizeForStableJson);
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(
      "revisionContentHash only accepts primitives, arrays, plain objects, and Date values",
    );
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(
        (entry): entry is [string, RevisionHashInput] =>
          entry[1] !== undefined,
      )
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nestedValue]) => [key, normalizeForStableJson(nestedValue)]),
  );
}

export function revisionContentHash(value: RevisionHashInput): string {
  return createHash("sha256")
    .update(JSON.stringify(normalizeForStableJson(value)))
    .digest("hex");
}

export function nextRevisionNumber(existing: readonly number[]): number {
  return existing.length === 0 ? 1 : Math.max(...existing) + 1;
}
