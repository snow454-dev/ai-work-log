import { z } from "zod";

const slugPattern = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;

const profileSchema = z.object({
  displayName: z
    .string({ error: "Display name is required." })
    .trim()
    .min(1, "Display name is required.")
    .max(120, "Display name must be 120 characters or fewer."),
  slug: z
    .string({ error: "Profile URL is required." })
    .trim()
    .toLowerCase()
    .regex(
      slugPattern,
      "Use 3-40 lowercase letters, numbers, or hyphens. Start and end with a letter or number.",
    ),
  headline: z.string().trim().max(160).default(""),
  bio: z.string().trim().max(2000).default(""),
  countryCode: z.preprocess((value) => {
    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim().toUpperCase();
    return trimmed.length === 0 ? null : trimmed;
  }, z.string().regex(/^[A-Z]{2}$/, "Use a two-letter country code.").nullable()),
  timeZone: z.preprocess((value) => {
    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }, z.string().max(80).nullable()),
  serviceCategories: z.preprocess((value) => {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value !== "string") {
      return [];
    }

    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }, z.array(z.string().min(1).max(80)).max(8)),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export function parseProfile(input: unknown): ProfileInput {
  return profileSchema.parse(input);
}

export function safeParseProfile(input: unknown) {
  return profileSchema.safeParse(input);
}
