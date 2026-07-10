import { NextResponse } from "next/server";

import { JobStatus } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { workerHeartbeatService } from "@/services/worker/workerHeartbeatService";

export async function GET() {
  try {
    // Get latest heartbeat
    const heartbeat = await workerHeartbeatService.getHeartbeat();

    // Queue metrics
    const [pending, running, completed, failed] = await Promise.all([
      prisma.deploymentJob.count({
        where: {
          status: JobStatus.PENDING,
        },
      }),

      prisma.deploymentJob.count({
        where: {
          status: JobStatus.RUNNING,
        },
      }),

      prisma.deploymentJob.count({
        where: {
          status: JobStatus.COMPLETED,
        },
      }),

      prisma.deploymentJob.count({
        where: {
          status: JobStatus.FAILED,
        },
      }),
    ]);

    // Worker considered online if heartbeat is newer than 30 seconds
    const workerOnline =
      heartbeat &&
      Date.now() - heartbeat.lastSeen.getTime() < 30_000;

    return NextResponse.json({
      worker: workerOnline ? "running" : "offline",
      workerId: heartbeat?.workerId ?? null,
      lastHeartbeat: heartbeat?.lastSeen ?? null,

      queue: {
        pending,
        running,
        completed,
        failed,
      },

      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message:
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