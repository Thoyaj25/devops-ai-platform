export const AUDIT_ACTIONS = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  LOGIN: "LOGIN",
  DEPLOY: "DEPLOY",
} as const;


export type AuditAction =
  typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];