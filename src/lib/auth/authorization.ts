import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { permissions } from "@/lib/auth/permissions";
import { UserRole } from "@/generated/prisma/enums";


export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.role) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}


export async function requirePermission(
  permission:
    | "CREATE_PROJECT"
    | "CREATE_ENVIRONMENT"
    | "CREATE_PIPELINE"
    | "CREATE_DEPLOYMENT"
    | "DELETE_RESOURCE"
) {

  const session = await requireAuth();

  const role = session.user.role as UserRole;


  const allowed =
    permission === "CREATE_PROJECT"
      ? permissions.canCreateProject(role)
      : permission === "CREATE_ENVIRONMENT"
      ? permissions.canCreateEnvironment(role)
      : permission === "CREATE_PIPELINE"
      ? permissions.canCreatePipeline(role)
      : permission === "CREATE_DEPLOYMENT"
      ? permissions.canCreateDeployment(role)
      : permission === "DELETE_RESOURCE"
      ? permissions.canDeleteResource(role)
      : false;


  if (!allowed) {
    throw new Error("FORBIDDEN");
  }


  return session;
}