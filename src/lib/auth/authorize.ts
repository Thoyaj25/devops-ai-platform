import { getServerSession } from "next-auth";

import { UserRole } from "@/generated/prisma";

import { authOptions } from "@/lib/auth/config";

import {
  UnauthorizedError,
  ForbiddenError,
} from "@/lib/api/errors";

export async function authorize() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.role) {
    throw new UnauthorizedError();
  }

  return session;
}

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  
  console.log("AUTH_CHECK_SESSION:", session);

  if (!session?.user?.id || !session.user.role) {
    console.log("AUTH_CHECK_FAILED: Unauthorized");
    throw new UnauthorizedError();
  }

  console.log("AUTH_CHECK_SUCCESS:", session.user.id, session.user.role);
  return session;
}

export async function authorizeRole(
  allowedRoles: UserRole[]
) {
  const session = await authorize();

  if (!allowedRoles.includes(session.user.role)) {
    throw new ForbiddenError();
  }

  return session;
}