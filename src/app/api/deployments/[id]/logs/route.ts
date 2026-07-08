import { NextRequest } from "next/server";
import { deploymentLogService } from "@/services/deployment/logs/deploymentLogService";

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  const { id } = await params;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let previousLogs = "";

      const interval = setInterval(async () => {
        // Step 6: Replace the Prisma query
        const deployment = await deploymentLogService.getLogs(id);

        if (!deployment) {
          clearInterval(interval);
          controller.close();
          return;
        }

        if (deployment.logs !== previousLogs) {
          previousLogs = deployment.logs ?? "";

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                logs: previousLogs,
                status: deployment.status,
              })}\n\n`
            )
          );

          // Step 8: Close the stream when deployment finishes
          if (
            deployment.status === "SUCCESS" ||
            deployment.status === "FAILED"
          ) {
            clearInterval(interval);
            controller.close();
          }
        }
      }, 1000);
    },
    cancel() {
      // Logic for stream cancellation
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