import type { EmailMessage } from "./types";

type TemplateBase = {
  to: string;
  professionalName: string;
  projectTitle: string;
} & Record<string, unknown>;

type VerificationInvitationInput = TemplateBase & {
  invitationUrl: string;
  expiresAt: string | Date;
  isReminder?: boolean;
};

type VerificationOtpInput = TemplateBase & {
  otp: string;
  expiresAt: string | Date;
};

type ProjectNotificationInput = TemplateBase & {
  note?: string;
  actionUrl?: string;
};

type BetaAccessRequestNotificationInput = {
  to: string;
  requestId: string;
  intent: "developer" | "company";
  requesterName: string;
  workEmail: string;
  companyName: string | null;
  role: string | null;
  useCase: string;
  sourcePath: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatInstant(value: string | Date): string {
  return new Date(value).toISOString();
}

function layout({
  title,
  body,
  cta,
}: {
  title: string;
  body: readonly string[];
  cta?: { label: string; href: string };
}) {
  const htmlBody = body
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("\n");
  const htmlCta = cta
    ? `<p><a href="${escapeHtml(
        cta.href,
      )}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#18181b;color:#ffffff;text-decoration:none;">${escapeHtml(
        cta.label,
      )}</a></p>`
    : "";
  const textCta = cta ? `\n\n${cta.label}: ${cta.href}` : "";

  return {
    html: `<!doctype html><html><body style="font-family:Arial,sans-serif;line-height:1.5;color:#18181b;"><h1>${escapeHtml(
      title,
    )}</h1>${htmlBody}${htmlCta}</body></html>`,
    text: `${title}\n\n${body.join("\n\n")}${textCta}`,
  };
}

export function verificationInvitation(
  input: VerificationInvitationInput,
): EmailMessage {
  const expiresAt = formatInstant(input.expiresAt);
  const title = input.isReminder
    ? `Reminder: verify ${input.projectTitle}`
    : `Verify ${input.projectTitle}`;
  const body = [
    `${input.professionalName} listed completed work with your company and asked you to verify the facts.`,
    `Project: ${input.projectTitle}`,
    `This link expires at ${expiresAt}. You can approve, request corrections, decline, or choose what may be shared publicly.`,
  ];
  const rendered = layout({
    title,
    body,
    cta: { label: "Review project evidence", href: input.invitationUrl },
  });

  return {
    to: input.to,
    subject: title,
    ...rendered,
  };
}

export function verificationOtp(input: VerificationOtpInput): EmailMessage {
  const expiresAt = formatInstant(input.expiresAt);
  const title = `Your verification code for ${input.projectTitle}`;
  const rendered = layout({
    title,
    body: [
      `${input.professionalName} requested company verification for ${input.projectTitle}.`,
      `Your code is ${input.otp}.`,
      `This code expires at ${expiresAt}.`,
    ],
  });

  return {
    to: input.to,
    subject: title,
    ...rendered,
  };
}

export function verificationCompleted(
  input: ProjectNotificationInput,
): EmailMessage {
  return notificationEmail(input, "Verification completed", [
    `${input.projectTitle} has been verified.`,
    input.note ?? "The professional can now choose what approved evidence to publish.",
  ]);
}

export function verificationDeclined(
  input: ProjectNotificationInput,
): EmailMessage {
  return notificationEmail(input, "Verification declined", [
    `${input.projectTitle} was declined by the reviewer.`,
    input.note ?? "No public evidence will be created from this verification.",
  ]);
}

export function verificationReceipt(
  input: ProjectNotificationInput,
): EmailMessage {
  return notificationEmail(input, "Verification receipt", [
    `Thank you for reviewing ${input.projectTitle}.`,
    input.note ?? "Your choices were recorded and can be referenced from your receipt link.",
  ]);
}

export function verificationWithdrawal(
  input: ProjectNotificationInput,
): EmailMessage {
  return notificationEmail(input, "Verification withdrawn", [
    `${input.projectTitle} is no longer public.`,
    input.note ?? "The public evidence card has been withdrawn.",
  ]);
}

export function verificationDispute(
  input: ProjectNotificationInput,
): EmailMessage {
  return notificationEmail(input, "Verification disputed", [
    `${input.projectTitle} has been marked disputed.`,
    input.note ?? "The evidence should stay hidden until the dispute is resolved.",
  ]);
}

export function betaAccessRequestNotification(
  input: BetaAccessRequestNotificationInput,
): EmailMessage {
  const subject = `New JISSEKI beta access request: ${input.requesterName}`;
  const sourceLine = input.sourcePath
    ? `Source: ${input.sourcePath}`
    : "Source: not provided";
  const rendered = layout({
    title: "New JISSEKI beta access request",
    body: [
      `Request ID: ${input.requestId}`,
      `Purpose: ${input.intent === "developer" ? "AI developer" : "Company buyer"}`,
      `Name: ${input.requesterName}`,
      `Work email: ${input.workEmail}`,
      `Company: ${input.companyName ?? "not provided"}`,
      `Role: ${input.role ?? "not provided"}`,
      `Use case: ${input.useCase}`,
      sourceLine,
      "Review this request in Supabase public.beta_access_requests, then add the work email to the beta allowlist if approved.",
    ],
  });

  return {
    to: input.to,
    subject,
    ...rendered,
  };
}

function notificationEmail(
  input: ProjectNotificationInput,
  subject: string,
  body: readonly string[],
): EmailMessage {
  const rendered = layout({
    title: subject,
    body: [
      `${input.professionalName}: ${input.projectTitle}`,
      ...body,
    ],
    cta: input.actionUrl
      ? { label: "Open details", href: input.actionUrl }
      : undefined,
  });

  return {
    to: input.to,
    subject,
    ...rendered,
  };
}
