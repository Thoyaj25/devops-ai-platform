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
    const session = await requireAuth();

    if (
      !permissions.canCreateDeployment(
        session.user.role
      )
    ) {
      return NextResponse.json(
        {
          error: "Forbidden",
        },
        {
          status: 403,
        }
      );
    }

    const validation = await validateRequest(
      request,
      createDeploymentSchema
    );

    if (!validation.success) {
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

    const hasAccess =
      await projectService.isUserAssociatedWithProject(
        session.user.id,
        validation.data.projectId
      );

    if (!hasAccess) {
      return NextResponse.json(
        {
          error: "Forbidden",
        },
        {
          status: 403,
        }
      );
    }

    const deployment =
      await deploymentService.initiateDeployment(
        validation.data,
        session.user.id
      );

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
    logger.error(
      { error },
      "Failed to create deployment"
    );

    return handleApiError(error);
  }
}