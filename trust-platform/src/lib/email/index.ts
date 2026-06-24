import "server-only";

import { env } from "@/lib/env";

import { createResendTransport } from "./resend-transport";
import { createSmtpTransport } from "./smtp-transport";
import type { EmailTransport } from "./types";

let cachedTransport: EmailTransport | undefined;

export function getEmailTransport(): EmailTransport {
  cachedTransport ??=
    env.MAIL_TRANSPORT === "resend"
      ? createResendTransport()
      : createSmtpTransport();

  return cachedTransport;
}
