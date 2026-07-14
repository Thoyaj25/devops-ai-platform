import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { logger } from "@/lib/logger";

import { deploymentService } from "@/services/deployment/deploymentService";
import { projectService } from "@/services/project/projectService";

/**
 * Step 1 — Inspect the routes
 * GET /api/deployments/:id retrieves a specific deployment by ID.
 */

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * Step 2 — Standardize GET /api/deployments/:id
 * Implements authentication and project-level authorization check.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const deployment = await deploymentService.getDeployment(id);

    if (!deployment) {
      return NextResponse.json(
        { error: "Deployment not found" },
        { status: 404 }
      );
    }

    /**
     * Standardize access control: ensure the authenticated user 
     * has access to the project associated with this deployment.
     */
    const hasAccess = await projectService.isUserAssociatedWithProject(
      session.user.id,
      deployment.projectId
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json(deployment);
  } catch (error) {
    logger.error(
      { error },
      "Failed to fetch deployment"
    );

    return NextResponse.json(
      { error: "Failed to fetch deployment" },
      { status: 500 }
    );
  }
}