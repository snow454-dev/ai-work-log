export const projectStatuses = [
  "draft",
  "sent",
  "viewed",
  "verified",
  "published",
  "withdrawn",
  "expired",
  "declined",
  "disputed",
] as const;

export type ProjectStatus = (typeof projectStatuses)[number];

const transitions: Record<ProjectStatus, readonly ProjectStatus[]> = {
  draft: ["sent"],
  sent: ["viewed", "expired", "declined", "draft"],
  viewed: ["verified", "expired", "declined", "draft"],
  verified: ["published", "draft", "disputed", "withdrawn"],
  published: ["withdrawn", "disputed", "draft"],
  withdrawn: ["published", "draft", "disputed"],
  expired: ["draft", "sent"],
  declined: ["draft"],
  disputed: ["withdrawn", "draft"],
};

export function canTransition(from: ProjectStatus, to: ProjectStatus): boolean {
  return transitions[from].includes(to);
}
