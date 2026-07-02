import "server-only";

import { randomUUID } from "node:crypto";
import { Resend } from "resend";

import { env } from "@/lib/env";

import type { EmailMessage, EmailTransport } from "./types";

export function createResendTransport(): EmailTransport {
  const resend = new Resend(env.RESEND_API_KEY);
  const from = env.MAIL_FROM;

  if (!from) {
    throw new Error("MAIL_FROM is required for Resend transport.");
  }

  return {
    async send(message: EmailMessage) {
      const { data, error } = await resend.emails.send({
        from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });

      if (error) {
        throw new Error(error.message);
      }

      return { id: data?.id ?? randomUUID() };
    },
  };
}
