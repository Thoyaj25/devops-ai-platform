import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { logger } from "@/lib/logger";

import { environmentService } from "@/services/environment/environmentService";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const body = await request.json();

    const environment =
      await environmentService.createEnvironment(
        {
          name: body.name,
          type: body.type,
        },
        body.projectId,
        session.user.id
      );

    return NextResponse.json(
      environment,
      {
        status: 201,
      }
    );
  } catch (error) {
    logger.error(
      {
        error,
      },
      "Failed to create environment"
    );

    return NextResponse.json(
      {
        error: "Failed to create environment",
      },
      {
        status: 500,
      }
    );
  }
}