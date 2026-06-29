import { ZodError } from "zod";

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
      mailTransport: "smtp" | "resend";
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
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false,
        missingOrInvalid: [
          ...new Set(
            error.issues.map((issue) => String(issue.path[0] ?? "unknown")),
          ),
        ].sort(),
      };
    }

    return {
      ok: false,
      missingOrInvalid: ["unknown"],
    };
  }
}

export async function GET() {
  const configuration = configurationCheck();
  const ok = configuration.ok;

  return Response.json(
    {
      ok,
      service: "proofboard",
      checkedAt: new Date().toISOString(),
      environment: environmentLabel(),
      commit: commitSha(),
      checks: {
        configuration,
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
