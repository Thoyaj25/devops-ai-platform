import { UserRole } from "@/generated/prisma/enums";

// Helper to verify if a role has at least the required access level
const hasRole = (role: UserRole, allowedRoles: UserRole[]) => {
  return allowedRoles.includes(role);
};

const DEV_AND_ADMIN = [UserRole.ADMIN, UserRole.DEVOPS_ENGINEER];

export const permissions = {
  canCreateProject(role: UserRole) {
    return hasRole(role, DEV_AND_ADMIN);
  },

  canCreateEnvironment(role: UserRole) {
    return hasRole(role, DEV_AND_ADMIN);
  },

  canCreatePipeline(role: UserRole) {
    return hasRole(role, DEV_AND_ADMIN);
  },

  canCreateDeployment(role: UserRole) {
    return hasRole(role, [...DEV_AND_ADMIN, UserRole.DEVELOPER]);
  },

  canDeleteResource(role: UserRole) {
    return hasRole(role, [UserRole.ADMIN]);
  },
};