import { z } from "zod";

const serverEnvSchema = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    APP_URL: z.url(),
    TOKEN_PEPPER: z.string().min(32),
    OTP_PEPPER: z.string().min(32),
    BETA_ALLOWED_EMAILS: z.string().optional(),
    MAIL_TRANSPORT: z.enum(["smtp", "resend", "manual"]),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().optional(),
    RESEND_API_KEY: z.string().optional(),
    MAIL_FROM: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (
      (value.MAIL_TRANSPORT === "smtp" || value.MAIL_TRANSPORT === "resend") &&
      !value.MAIL_FROM
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["MAIL_FROM"],
        message: "MAIL_FROM is required for email transport",
      });
    }

    if (
      value.MAIL_TRANSPORT === "smtp" &&
      (!value.SMTP_HOST || !value.SMTP_PORT)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["SMTP_HOST"],
        message: "SMTP_HOST and SMTP_PORT are required for smtp transport",
      });
    }

    if (value.MAIL_TRANSPORT === "resend" && !value.RESEND_API_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["RESEND_API_KEY"],
        message: "RESEND_API_KEY is required for resend transport",
      });
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(
  input: NodeJS.ProcessEnv | Record<string, string | undefined>,
): ServerEnv {
  return serverEnvSchema.parse(input);
}
