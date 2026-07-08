import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { logger } from "@/lib/logger";

import { authOptions } from "@/lib/auth/config";
import { deploymentService } from "@/services/deployment/deploymentService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const environmentId = searchParams.get("environmentId");

    if (!environmentId) {
      return NextResponse.json(
        {
          error: "environmentId is required",
        },
        {
          status: 400,
        }
      );
    }

    const deployments = await deploymentService.getEnvironmentDeployments(
      environmentId
    );

    return NextResponse.json(deployments);
  } catch (error) {
    logger.error({ error }, "GET /api/deployments error");

    return NextResponse.json(
      {
        error: "Failed to fetch deployments",
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

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { version, projectId, environmentId, pipelineId } = body;

    if (!projectId || !environmentId || !pipelineId) {
      return NextResponse.json(
        {
          error: "projectId, environmentId and pipelineId are required",
        },
        {
          status: 400,
        }
      );
    }

    const deployment = await deploymentService.createDeployment({
      version,
      projectId,
      environmentId,
      pipelineId,
    });

    return NextResponse.json(deployment, {
      status: 201,
    });
  } catch (error) {
    logger.error({ error }, "POST /api/deployments error");

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create deployment",
      },
      {
        status: 500,
      }
    );
  }
}