import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
// Assuming you have a worker orchestration service defined
import { runDeploymentWorker } from "@/workers/deploymentWorker";

/**
 * Step 1 — Inspect the worker API
 * 
 * Refactored to delegate execution to the worker orchestration layer
 * rather than calling the executor directly within the API route.
 */
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

    // Delegate orchestration to the worker service
    // The service handles the background execution/job loop logic
    await runDeploymentWorker();

    return NextResponse.json({
      message: "Deployment worker successfully triggered",
      deploymentId,
      jobId,
    });
  } catch (error) {
    logger.error({ error }, "Failed to trigger deployment worker");

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to trigger deployment worker" 
      },
      { status: 500 }
    );
  }
}