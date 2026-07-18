import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { logger } from "@/lib/logger";

import { deploymentService } from "@/services/deployment/deploymentService";
import { deploymentControlService } from "@/services/deployment/deploymentControlService";
import { projectService } from "@/services/project/projectService";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/deployments/:id
 *
 * Fetch deployment details
 * Includes:
 * - Authentication
 * - Project ownership/access validation
 */
export async function GET(
  _request: Request,
  { params }: RouteContext
) {
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

    const { id } = await params;

    const deployment =
      await deploymentService.getDeployment(id);

    if (!deployment) {
      return NextResponse.json(
        {
          error: "Deployment not found",
        },
        {
          status: 404,
        }
      );
    }


    const hasAccess =
      await projectService.isUserAssociatedWithProject(
        session.user.id,
        deployment.projectId
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


    return NextResponse.json(deployment);

  } catch (error) {

    logger.error(
      {
        error,
      },
      "Failed to fetch deployment"
    );


    return NextResponse.json(
      {
        error: "Failed to fetch deployment",
      },
      {
        status: 500,
      }
    );
  }
}


/**
 * DELETE /api/deployments/:id
 *
 * Removes running deployment container.
 *
 * Flow:
 * API
 *  |
 *  v
 * Auth validation
 *  |
 *  v
 * Deployment lookup
 *  |
 *  v
 * Project authorization
 *  |
 *  v
 * Docker remove container
 *  |
 *  v
 * Clear deployment runtime metadata
 */
export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
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


    const { id } = await params;


    const deployment =
      await deploymentService.getDeployment(id);


    if (!deployment) {
      return NextResponse.json(
        {
          error: "Deployment not found",
        },
        {
          status: 404,
        }
      );
    }


    const hasAccess =
      await projectService.isUserAssociatedWithProject(
        session.user.id,
        deployment.projectId
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


    const result =
      await deploymentControlService.remove(id);


    return NextResponse.json(result);


  } catch (error) {

    logger.error(
      {
        error,
      },
      "Failed to remove deployment"
    );


    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to remove deployment",
      },
      {
        status: 500,
      }
    );
  }
}