import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { UserRole } from "@/generated/prisma/enums";
import { permissions } from "./permissions";


type PermissionCheck =
  | "canCreateProject"
  | "canCreateEnvironment"
  | "canCreatePipeline"
  | "canCreateDeployment"
  | "canDeleteResource";


export async function requirePermission(
  permission: PermissionCheck
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.role) {
    throw new Error("UNAUTHORIZED");
  }


  const role = session.user.role as UserRole;


  const allowed = permissions[permission](role);


  if (!allowed) {
    throw new Error("FORBIDDEN");
  }


  return session;
}