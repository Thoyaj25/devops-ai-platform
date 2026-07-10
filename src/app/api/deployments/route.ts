import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { logger } from "@/lib/logger";

import { authOptions } from "@/lib/auth/config";
import { permissions } from "@/lib/auth/permissions";
import { deploymentService } from "@/services/deployment/deploymentService";
import { deploymentExecutor } from "@/services/deployment/deploymentExecutor";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const environmentId = searchParams.get("environmentId");

    if (!environmentId) {
      return NextResponse.json(
        { error: "environmentId is required" },
        { status: 400 }
      );
    }

    const deployments = await deploymentService.getEnvironmentDeployments(
      environmentId
    );

    return NextResponse.json(deployments);
  } catch (error) {
    logger.error({ error }, "Failed to fetch deployments");
    return NextResponse.json(
      { error: "Failed to fetch deployments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!permissions.canCreateDeployment(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Delegation: Input validation is now handled inside deploymentService.createDeployment
    // via Zod schema parsing.
    const deployment = await deploymentService.createDeployment(
      {
        version: body.version,
        projectId: body.projectId,
        environmentId: body.environmentId,
        pipelineId: body.pipelineId,
      },
      session.user.id
    );

    // Execute deployment asynchronously
    deploymentExecutor.execute(deployment.id).catch((err) =>
      logger.error({ err }, "Deployment execution failed")
    );

    return NextResponse.json(deployment, { status: 201 });
  } catch (error) {
    logger.error({ error }, "Failed to create deployment");

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create deployment",
      },
      { status: 500 }
    );
  }
}