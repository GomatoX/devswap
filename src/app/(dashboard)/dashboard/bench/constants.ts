/**
 * Shared constants for developer management
 */

export const EXPERIENCE_LEVELS = [
  "Junior",
  "Mid",
  "Senior",
  "Lead",
  "Principal",
] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const POPULAR_SKILLS = [
  "React",
  "TypeScript",
  "Node.js",
  "Python",
  "Java",
  "Go",
  "PostgreSQL",
  "MongoDB",
  "AWS",
  "Docker",
  "Kubernetes",
  "Next.js",
  "Vue.js",
  "Angular",
  "GraphQL",
  "REST API",
] as const;
