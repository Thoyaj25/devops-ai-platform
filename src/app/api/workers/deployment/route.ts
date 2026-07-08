import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { deploymentExecutor } from "@/services/deployment/deploymentExecutor";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deploymentId, jobId } = body;

    if (!deploymentId || !jobId) {
      return NextResponse.json(
        { error: "deploymentId and jobId are required" },
        { status: 400 }
      );
    }

    // Connect Worker with Executor
    // We execute asynchronously to not block the worker response
    deploymentExecutor.execute(deploymentId).catch((error) => {
      logger.error({ error, deploymentId, jobId }, "Background deployment execution failed");
    });

    return NextResponse.json({
      message: "Deployment execution started",
      deploymentId,
      jobId,
    });
  } catch (error) {
    logger.error({ error }, "Failed to trigger deployment worker");

    return NextResponse.json(
      { error: "Failed to trigger deployment worker" },
      { status: 500 }
    );
  }
}