import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

import { deploymentService } from "@/services/deployment/deploymentService";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const deployment = await deploymentService.getDeployment(id);

    if (!deployment) {
      return NextResponse.json(
        { error: "Deployment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(deployment);
  } catch (error) {
    logger.error(
      { error },
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