import "server-only";

import { env } from "@/lib/env";

import { createManualTransport } from "./manual-transport";
import { createResendTransport } from "./resend-transport";
import { createSmtpTransport } from "./smtp-transport";
import type { EmailTransport } from "./types";

let cachedTransport: EmailTransport | undefined;

export function getEmailTransport(): EmailTransport {
  cachedTransport ??= (() => {
    if (env.MAIL_TRANSPORT === "manual") {
      return createManualTransport();
    }

    return env.MAIL_TRANSPORT === "resend"
      ? createResendTransport()
      : createSmtpTransport();
  })();

  return cachedTransport;
}
