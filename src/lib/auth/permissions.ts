import { UserRole } from "@/generated/prisma/enums";

export const PERMISSIONS: Record<string, UserRole[]> = {
  CREATE_PROJECT: [UserRole.ADMIN, UserRole.DEVOPS_ENGINEER],
  CREATE_ENVIRONMENT: [UserRole.ADMIN, UserRole.DEVOPS_ENGINEER],
  CREATE_PIPELINE: [UserRole.ADMIN, UserRole.DEVOPS_ENGINEER],
  CREATE_DEPLOYMENT: [
    UserRole.ADMIN,
    UserRole.DEVOPS_ENGINEER,
    UserRole.DEVELOPER,
  ],
  DELETE_RESOURCE: [UserRole.ADMIN],
};

export const permissions = {
  canCreateProject: (role: UserRole) =>
    PERMISSIONS.CREATE_PROJECT.includes(role),

  canCreateEnvironment: (role: UserRole) =>
    PERMISSIONS.CREATE_ENVIRONMENT.includes(role),

  canCreatePipeline: (role: UserRole) =>
    PERMISSIONS.CREATE_PIPELINE.includes(role),

  canCreateDeployment: (role: UserRole) =>
    PERMISSIONS.CREATE_DEPLOYMENT.includes(role),

  canDeleteResource: (role: UserRole) =>
    PERMISSIONS.DELETE_RESOURCE.includes(role),
};