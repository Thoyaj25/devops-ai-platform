import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { logger } from "@/lib/logger";
import { authOptions } from "@/lib/auth/config";
import { permissions } from "@/lib/auth/permissions";
import { deploymentService } from "@/services/deployment/deploymentService";

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

    const deployments = await deploymentService.getEnvironmentDeployments(environmentId);
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

    // Refactored: Unified service method handles creation and async execution trigger
    const deployment = await deploymentService.createDeployment(body, session.user.id);

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