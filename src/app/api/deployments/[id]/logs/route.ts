import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { logger } from "@/lib/logger";
import { deploymentLogService } from "@/services/deployment/logs/deploymentLogService";
import { deploymentRepository } from "@/repositories/deploymentRepository";
import { projectService } from "@/services/project/projectService";

/**
 * Step 1 — Inspect the routes
 * GET /api/deployments/:id/logs: Streams deployment logs via Server-Sent Events (SSE).
 */

/**
 * Step 2 — Standardize GET /api/deployments/:id/logs
 * Implements authentication and project-level authorization check.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch deployment to verify project association
    const deployment = await deploymentRepository.findById(id);

    if (!deployment) {
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
    }

    // Standardize access control: ensure user has access to the project
    const hasAccess = await projectService.isUserAssociatedWithProject(
      session.user.id,
      deployment.projectId
    );

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        type DeploymentLogEntry = Awaited<
          ReturnType<typeof deploymentLogService.getLogs>
        >[number];

        let previousLogs: DeploymentLogEntry[] = [];
        let previousLogSignature: string | null = null;
        let closed = false;

        const closeStream = () => {
          if (!closed) {
            closed = true;
            controller.close();
          }
        };

        const interval = setInterval(async () => {
          if (closed) {
            clearInterval(interval);
            return;
          }

          try {
            // Fetch updated deployment status and logs via deploymentLogService
            const currentDeployment = await deploymentRepository.findById(id);
            const logs = await deploymentLogService.getLogs(id);

            if (!currentDeployment) {
              clearInterval(interval);
              closeStream();
              return;
            }

            const logSignature = JSON.stringify(logs);

            if (logSignature !== previousLogSignature) {
              previousLogs = logs ?? [];
              previousLogSignature = logSignature;

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    logs: previousLogs,
                    status: currentDeployment.status,
                  })}\n\n`
                )
              );

              // Close the stream when deployment finishes
              if (
                currentDeployment.status === "SUCCESS" ||
                currentDeployment.status === "FAILED"
              ) {
                clearInterval(interval);
                closeStream();
              }
            }
          } catch (error) {
            logger.error({ error }, "Deployment stream error");
            clearInterval(interval);
            closeStream();
          }
        }, 1000);

        request.signal.addEventListener("abort", () => {
          clearInterval(interval);
          closeStream();
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to stream deployment logs");
    return NextResponse.json(
      { error: "Failed to stream logs" },
      { status: 500 }
    );
  }
}