import { NextRequest } from "next/server";

import { deploymentRepository } from "@/repositories/deploymentRepository";

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const { id } = await params;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
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
          const deployment =
            await deploymentRepository.findLogs(id);

          if (!deployment) {
            clearInterval(interval);
            closeStream();
            return;
          }

          if (closed) {
            clearInterval(interval);
            return;
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                status: deployment.status,
                logs: deployment.logs,
              })}\n\n`
            )
          );

          if (
            deployment.status === "SUCCESS" ||
            deployment.status === "FAILED"
          ) {
            clearInterval(interval);
            closeStream();
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