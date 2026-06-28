import { z } from "zod";

const optionalText = (max: number) =>
  z.preprocess((value) => {
    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }, z.string().max(max).nullable());

const referenceRequestSchema = z.object({
  requesterName: z
    .string({ error: "Your name is required." })
    .trim()
    .min(1, "Your name is required.")
    .max(120, "Your name must be 120 characters or fewer."),
  requesterEmail: z
    .email("Use a valid work email.")
    .trim()
    .max(254, "Email must be 254 characters or fewer."),
  requesterCompany: z
    .string({ error: "Company is required." })
    .trim()
    .min(1, "Company is required.")
    .max(160, "Company must be 160 characters or fewer."),
  requesterRole: optionalText(160),
  opportunityContext: z
    .string({ error: "Context is required." })
    .trim()
    .min(10, "Add a little more context.")
    .max(1000, "Context must be 1000 characters or fewer."),
  message: optionalText(1000),
  consentConfirmed: z.literal(true, {
    error: "Confirm how this request will be handled.",
  }),
});

export type ReferenceRequestInput = z.infer<typeof referenceRequestSchema>;

export function parseReferenceRequest(input: unknown): ReferenceRequestInput {
  return referenceRequestSchema.parse(input);
}

export function safeParseReferenceRequest(input: unknown) {
  return referenceRequestSchema.safeParse(input);
}
