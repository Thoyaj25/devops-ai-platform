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
  console.log("========== START API ==========");

  try {
    console.log("1. Authenticating user...");

    const session = await getServerSession(authOptions);

    console.log("SESSION =", session);

    if (!session?.user?.id) {
      console.log("Authentication failed");

      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    console.log("Authenticated:", session.user.id);

    console.log("2. Resolving deployment id...");

    const { id } = await params;

    console.log("Deployment ID =", id);

    console.log("3. Loading deployment...");

    const deployment =
      await deploymentService.getDeployment(id);

    console.log("Deployment =", deployment);

    if (!deployment) {
      console.log("Deployment not found");

      return NextResponse.json(
        {
          error: "Deployment not found",
        },
        {
          status: 404,
        }
      );
    }

    console.log("4. Checking project access...");

    const hasAccess =
      await projectService.isUserAssociatedWithProject(
        session.user.id,
        deployment.projectId
      );

    console.log("Project access =", hasAccess);

    if (!hasAccess) {
      console.log("Access denied");

      return NextResponse.json(
        {
          error: "Forbidden",
        },
        {
          status: 403,
        }
      );
    }

    console.log("5. Starting deployment...");

    const result =
      await deploymentControlService.start(id);

    console.log("Start result =", result);

    console.log("========== START API SUCCESS ==========");

    return NextResponse.json(result);

  } catch (error) {
    console.error("========== START API ERROR ==========");
    console.error(error);

    logger.error(
      { error },
      "Failed to start deployment"
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to start deployment",
      },
      {
        status: 500,
      }
    );
  }
}