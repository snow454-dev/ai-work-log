import { z } from "zod";

export const betaAccessIntents = ["developer", "company"] as const;

const optionalText = (max: number) =>
  z.preprocess((value) => {
    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }, z.string().max(max).nullable());

const betaAccessRequestSchema = z.object({
  intent: z.enum(betaAccessIntents, {
    error: "Choose how you want to use JISSEKI.",
  }),
  requesterName: z
    .string({ error: "Your name is required." })
    .trim()
    .min(1, "Your name is required.")
    .max(120, "Your name must be 120 characters or fewer."),
  workEmail: z
    .email("Use a valid work email.")
    .trim()
    .max(254, "Email must be 254 characters or fewer."),
  companyName: optionalText(160),
  role: optionalText(160),
  useCase: z
    .string({ error: "Use case is required." })
    .trim()
    .min(10, "Add a little more context.")
    .max(1000, "Use case must be 1000 characters or fewer."),
  sourcePath: optionalText(200),
  consentConfirmed: z.literal(true, {
    error: "Confirm how this request will be handled.",
  }),
});

export type BetaAccessIntent = (typeof betaAccessIntents)[number];
export type BetaAccessRequestInput = z.infer<typeof betaAccessRequestSchema>;

export function parseBetaAccessRequest(
  input: unknown,
): BetaAccessRequestInput {
  return betaAccessRequestSchema.parse(input);
}

export function safeParseBetaAccessRequest(input: unknown) {
  return betaAccessRequestSchema.safeParse(input);
}
