import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

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
      "GET /api/environments error"
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
    const body = await request.json();

    const { projectId, name, type } = body;

    if (!projectId || !name || !type) {
      return NextResponse.json(
        {
          error: "projectId, name and type are required",
        },
        {
          status: 400,
        }
      );
    }

    const environment = await environmentService.createEnvironment(
      {
        name,
        type,
      },
      projectId
    );

    return NextResponse.json(environment, {
      status: 201,
    });
  } catch (error) {
    logger.error(
      { error },
      "POST /api/environments error"
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