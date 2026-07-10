import { JobStatus } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export const queueMetricsService = {
  async getQueueMetrics() {
    const [
      pending,
      running,
      completed,
      failed,
    ] = await Promise.all([
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

    return {
      pending,
      running,
      completed,
      failed,
    };
  },
};