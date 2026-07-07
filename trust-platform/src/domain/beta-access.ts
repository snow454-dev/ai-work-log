export const betaAccessDeniedMessage =
  "This private beta is invite-only. Ask the JISSEKI team for access.";

export function parseBetaAllowedEmails(
  value?: string | null,
): readonly string[] {
  if (!value) {
    return [];
  }

  return [
    ...new Set(
      value
        .split(/[,\n]/)
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean),
    ),
  ].sort();
}

export function isEmailAllowedForBeta({
  email,
  allowedEmails,
  additionalAllowedEmails,
}: {
  email: string;
  allowedEmails?: string | null;
  additionalAllowedEmails?: string | null;
}): boolean {
  const allowed = parseBetaAllowedEmails(
    [allowedEmails, additionalAllowedEmails].filter(Boolean).join(","),
  );

  if (allowed.length === 0) {
    return true;
  }

  return allowed.includes(email.trim().toLowerCase());
}
