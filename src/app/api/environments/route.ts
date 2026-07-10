import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { permissions } from "@/lib/auth/permissions";

import { environmentService } from "@/services/environment/environmentService";


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        {
          error: "projectId is required",
        },
        {
          status: 400,
        }
      );
    }

    const environments =
      await environmentService.getProjectEnvironments(projectId);

    return NextResponse.json(environments);

  } catch (error) {
    logger.error(
      { error },
      "Failed to fetch environments"
    );

    return NextResponse.json(
      {
        error: "Failed to fetch environments",
      },
      {
        status: 500,
      }
    );
  }
}


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    if (!permissions.canCreateEnvironment(session.user.role)) {
      return NextResponse.json(
        {
          error: "Forbidden",
        },
        {
          status: 403,
        }
      );
    }


    const body = await request.json();

    const environment =
      await environmentService.createEnvironment(
        body,
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
      { error },
      "Failed to create environment"
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create environment",
      },
      {
        status: 500,
      }
    );
  }
}