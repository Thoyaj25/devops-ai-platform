import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "./config";
import type { UserRole } from "@/generated/prisma/enums";


export async function requireRole(
  allowedRoles: UserRole[]
) {

  const session =
    await getServerSession(authOptions);


  if (!session?.user?.id) {

    return {
      error: NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      ),
    };

  }


  const role =
    session.user.role;


  if (!allowedRoles.includes(role)) {

    return {
      error: NextResponse.json(
        {
          error: "Forbidden",
        },
        {
          status: 403,
        }
      ),
    };

  }


  return {
    session,
  };
}