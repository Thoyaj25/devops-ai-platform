export const AUDIT_RESOURCES = {
  PROJECT: "PROJECT",
  ENVIRONMENT: "ENVIRONMENT",
  PIPELINE: "PIPELINE",
  DEPLOYMENT: "DEPLOYMENT",
  USER: "USER",
} as const;


export type AuditResource =
  typeof AUDIT_RESOURCES[keyof typeof AUDIT_RESOURCES];