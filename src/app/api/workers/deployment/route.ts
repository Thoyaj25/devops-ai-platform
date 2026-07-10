import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
// Assuming you have a worker orchestration service defined
import { runDeploymentWorker } from "@/workers/deploymentWorker";

/**
 * Step 2 — Secure worker route
 * 
 * Validates the request using an environment-specific WORKER_SECRET 
 * to ensure only authorized internal services can trigger the worker.
 */
export async function POST(request: NextRequest) {
  try {
    // Validate request authorization
    const authHeader = request.headers.get("x-worker-secret");
    if (!authHeader || authHeader !== process.env.WORKER_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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

/**
 * Step 6 — Health endpoints
 * 
 * Basic health check for the worker orchestration endpoint.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Worker endpoint is healthy",
    timestamp: new Date().toISOString(),
  });
}