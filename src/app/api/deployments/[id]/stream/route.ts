import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { deploymentLogService } from "@/services/deployment/logs/deploymentLogService";
import { deploymentRepository } from "@/repositories/deploymentRepository";

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  // Step 2: Protect deployment stream API with authentication
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await params;

  // Optional: Add authorization check here to ensure the user 
  // has permission to view this specific deployment

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let previousLogs = "";
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
          // Fetch logs and status together
          const deployment = await deploymentRepository.findById(id);
          const logs = await deploymentLogService.getLogs(id);

          if (!deployment) {
            clearInterval(interval);
            closeStream();
            return;
          }

          if (logs !== previousLogs) {
            previousLogs = logs ?? "";

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  logs: previousLogs,
                  status: deployment.status,
                })}\n\n`
              )
            );

            // Close the stream when deployment finishes
            if (
              deployment.status === "SUCCESS" ||
              deployment.status === "FAILED"
            ) {
              clearInterval(interval);
              closeStream();
            }
          }
        } catch (error) {
          console.error("Deployment stream error:", error);
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
}