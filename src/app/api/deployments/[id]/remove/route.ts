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

export async function POST(
    request: Request,
  { params }: RouteContext
) {
  console.log("========== REMOVE API ==========");

  try {
    console.log("1. Authenticating user...");

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("Authenticated:", session.user.id);

    const { id } = await params;

    console.log("Deployment ID =", id);

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

    console.log("========== REMOVE API SUCCESS ==========");

    return NextResponse.json(result);

  } catch (error) {
    console.error(error);

    logger.error(
      { error },
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