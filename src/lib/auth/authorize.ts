import { getServerSession } from "next-auth";

import { UserRole } from "@/generated/prisma/enums";

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
  return authorize();
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