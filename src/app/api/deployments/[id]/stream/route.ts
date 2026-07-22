import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { logger } from "@/lib/logger";

import { deploymentLogService } from "@/services/deployment/logs/deploymentLogService";
import { deploymentRepository } from "@/repositories/deploymentRepository";
import { projectService } from "@/services/project/projectService";

const TERMINAL_STATES = [
  "SUCCESS",
  "FAILED",
  "SUPERSEDED",
  "CANCELLED",
] as const;

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  logger.info("=== STREAM ENDPOINT HIT ===");

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

    const deployment = await deploymentRepository.findById(id);

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

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let closed = false;
        let lastSignature = "";

        const closeStream = () => {
          if (closed) return;

          closed = true;

          try {
            controller.close();
          } catch {
            // Stream already closed
          }
        };

        const sendLogs = async () => {
          if (closed) return;

          try {
            const currentDeployment =
              await deploymentRepository.findById(id);

            if (!currentDeployment) {
              clearInterval(interval);
              closeStream();
              return;
            }

            const logEntries =
              await deploymentLogService.getLogs(id);

            const payload = {
              logs: logEntries
                .map((entry) => entry.message)
                .join("\n"),

              status: currentDeployment.status,
            };

            const signature =
              JSON.stringify(payload);

            if (signature !== lastSignature) {
              lastSignature = signature;

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify(payload)}\n\n`
                )
              );
            }

            if (
              TERMINAL_STATES.includes(
                currentDeployment.status as (typeof TERMINAL_STATES)[number]
              )
            ) {
              clearInterval(interval);
              closeStream();
            }
          } catch (error) {
            logger.error(
              {
                error,
                deploymentId: id,
              },
              "Deployment SSE stream failed"
            );

            clearInterval(interval);
            closeStream();
          }
        };

        const interval = setInterval(
          sendLogs,
          1000
        );

        // Send initial payload immediately
        await sendLogs();

        request.signal.addEventListener("abort", () => {
          clearInterval(interval);
          closeStream();
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    logger.error(
      {
        error,
      },
      "Failed to stream deployment logs"
    );

    return NextResponse.json(
      {
        error: "Failed to stream logs",
      },
      {
        status: 500,
      }
    );
  }
}