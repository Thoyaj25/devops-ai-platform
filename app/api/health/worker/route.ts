import { NextResponse } from "next/server";

import { queueMetricsService } from "@/services/metrics/queueMetricsService";
import { workerHeartbeatService } from "@/services/worker/workerHeartbeatService";

export async function GET() {
  try {
    const [
      metrics,
      heartbeat,
    ] = await Promise.all([
      queueMetricsService.getQueueMetrics(),
      workerHeartbeatService.getHeartbeat(),
    ]);

    let workerStatus = "offline";

    if (heartbeat) {
      const age =
        Date.now() -
        heartbeat.lastSeen.getTime();

      if (age < 30 * 1000) {
        workerStatus = "online";
      } else if (age < 120 * 1000) {
        workerStatus = "degraded";
      }
    }

    return NextResponse.json({
      worker: workerStatus,
      lastHeartbeat: heartbeat?.lastSeen ?? null,
      queue: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        worker: "unknown",
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}