import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

import { deploymentService } from "@/services/deployment/deploymentService";
import { projectService } from "@/services/project/projectService";

import { requireAuth } from "@/lib/auth/authorize";
import { permissions } from "@/lib/auth/permissions";

import { validateRequest } from "@/lib/api/validation";
import { handleApiError } from "@/lib/api/errors";

import { createDeploymentSchema } from "@/lib/validation/deployment";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    const { searchParams } = new URL(request.url);

    const projectId = searchParams.get("projectId");
    const environmentId = searchParams.get("environmentId");

    let deployments;

    if (projectId) {
      const hasAccess =
        await projectService.isUserAssociatedWithProject(
          session.user.id,
          projectId
        );

      if (!hasAccess) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }

      deployments =
        await deploymentService.getProjectDeployments(projectId);
    } else if (environmentId) {
      deployments =
        await deploymentService.getEnvironmentDeployments(
          environmentId
        );
    } else {
      return NextResponse.json(
        {
          error: "projectId or environmentId is required",
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: deployments,
    });
  } catch (error) {
    logger.error(
      { error },
      "Failed to fetch deployments"
    );

    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("STEP 0: Starting POST /api/deployments");

    const session = await requireAuth();
    console.log("STEP 1: Auth check passed for user", session.user.id);

    if (
      !permissions.canCreateDeployment(
        session.user.role
      )
    ) {
      console.log("STEP 2: Forbidden - Insufficient role", session.user.role);
      return NextResponse.json(
        {
          error: "Forbidden",
        },
        {
          status: 403,
        }
      );
    }

    console.log("STEP 3: Validating request schema");
    const validation = await validateRequest(
      request,
      createDeploymentSchema
    );

    if (!validation.success) {
      console.log("STEP 3.1: Validation failed", validation.error);
      return NextResponse.json(
        {
          error: "Invalid request",
          details: validation.error,
        },
        {
          status: 400,
        }
      );
    }

    console.log("STEP 4: Checking project access for", validation.data.projectId);
    const hasAccess =
      await projectService.isUserAssociatedWithProject(
        session.user.id,
        validation.data.projectId
      );

    if (!hasAccess) {
      console.log("STEP 4.1: Forbidden - User not associated with project");
      return NextResponse.json(
        {
          error: "Forbidden",
        },
        {
          status: 403,
        }
      );
    }

    console.log("STEP 5: Initiating deployment");
    const deployment =
      await deploymentService.initiateDeployment(
        validation.data,
        session.user.id
      );

    console.log("STEP 6: Deployment created successfully", deployment.id);
    return NextResponse.json(
      {
        success: true,
        data: deployment,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.log("STEP ERROR: Deployment failed", error);
    logger.error(
      { error },
      "Failed to create deployment"
    );

    return handleApiError(error);
  }
}