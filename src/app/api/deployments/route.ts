import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { permissions } from "@/lib/auth/permissions";
import { logger } from "@/lib/logger";
import { deploymentService } from "@/services/deployment/deploymentService";
import { projectService } from "@/services/project/projectService";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const environmentId = searchParams.get("environmentId");

    // Support querying deployments by project or environment
    if (projectId) {
      // Step 6.1: Validate project access for GET by project
      const hasAccess = await projectService.isUserAssociatedWithProject(
        session.user.id,
        projectId
      );
      if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

      const deployments = await deploymentService.getProjectDeployments(projectId);
      return NextResponse.json(deployments);
    }

    if (environmentId) {
      // Optional: Add environment-level access validation here if needed
      const deployments = await deploymentService.getEnvironmentDeployments(environmentId);
      return NextResponse.json(deployments);
    }

    return NextResponse.json(
      { error: "projectId or environmentId is required" },
      { status: 400 }
    );
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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!permissions.canCreateDeployment(session.user.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Step 6.1: Validate project access before initiating deployment
    const hasAccess = await projectService.isUserAssociatedWithProject(
      session.user.id,
      body.projectId
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const deployment = await deploymentService.initiateDeployment(
      body,
      session.user.id
    );

    return NextResponse.json(deployment, {
      status: 201,
    });
  } catch (error) {
    logger.error({ error }, "Failed to create deployment");

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create deployment",
      },
      {
        status: 500,
      }
    );
  }
}