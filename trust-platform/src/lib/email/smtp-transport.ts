import "server-only";

import nodemailer from "nodemailer";

import { env } from "@/lib/env";

import type { EmailMessage, EmailTransport } from "./types";

export function createSmtpTransport(): EmailTransport {
  const from = env.MAIL_FROM;

  if (!from) {
    throw new Error("MAIL_FROM is required for SMTP transport.");
  }

  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: false,
  });

  return {
    async send(message: EmailMessage) {
      const result = await transport.sendMail({
        from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });

      return { id: String(result.messageId) };
    },
  };
}
