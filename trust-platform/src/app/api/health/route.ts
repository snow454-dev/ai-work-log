import { ZodError } from "zod";

import { parseBetaAllowedEmails } from "@/domain/beta-access";
import { parseServerEnv } from "@/lib/env-schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function environmentLabel(): string {
  return process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown";
}

function commitSha(): string | null {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA;

  return sha ? sha.slice(0, 12) : null;
}

function configurationCheck():
  | {
      ok: true;
      mailTransport: "smtp" | "resend" | "manual";
      betaAllowlistConfigured: boolean;
    }
  | {
      ok: false;
      missingOrInvalid: string[];
    } {
  try {
    const env = parseServerEnv(process.env);

    return {
      ok: true,
      mailTransport: env.MAIL_TRANSPORT,
      betaAllowlistConfigured:
        parseBetaAllowedEmails(
          [env.BETA_ALLOWED_EMAILS, env.BETA_ADDITIONAL_ALLOWED_EMAILS]
            .filter(Boolean)
            .join(","),
        ).length > 0,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const missingOrInvalid = new Set(
        error.issues.map((issue) => String(issue.path[0] ?? "unknown")),
      );

      if (
        process.env.MAIL_TRANSPORT === "resend" &&
        !process.env.RESEND_API_KEY
      ) {
        missingOrInvalid.add("RESEND_API_KEY");
      }

      if (process.env.MAIL_TRANSPORT === "smtp") {
        if (!process.env.SMTP_HOST) {
          missingOrInvalid.add("SMTP_HOST");
        }

        if (!process.env.SMTP_PORT) {
          missingOrInvalid.add("SMTP_PORT");
        }
      }

      if (
        (process.env.MAIL_TRANSPORT === "resend" ||
          process.env.MAIL_TRANSPORT === "smtp") &&
        !process.env.MAIL_FROM
      ) {
        missingOrInvalid.add("MAIL_FROM");
      }

      return {
        ok: false,
        missingOrInvalid: [...missingOrInvalid].sort(),
      };
    }

    return {
      ok: false,
      missingOrInvalid: ["unknown"],
    };
  }
}

function betaAccessCheck({
  environment,
}: {
  environment: string;
}) {
  const required = environment !== "development" && environment !== "test";
  const allowlistConfigured =
    parseBetaAllowedEmails(
      [
        process.env.BETA_ALLOWED_EMAILS,
        process.env.BETA_ADDITIONAL_ALLOWED_EMAILS,
      ]
        .filter(Boolean)
        .join(","),
    ).length > 0;

  return {
    ok: !required || allowlistConfigured,
    required,
    allowlistConfigured,
  };
}

export async function GET() {
  const environment = environmentLabel();
  const configuration = configurationCheck();
  const betaAccess = betaAccessCheck({ environment });
  const ok = configuration.ok && betaAccess.ok;

  return Response.json(
    {
      ok,
      service: "jisseki",
      checkedAt: new Date().toISOString(),
      environment,
      commit: commitSha(),
      checks: {
        configuration,
        betaAccess,
      },
    },
    {
      status: ok ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
