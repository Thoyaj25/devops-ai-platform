import { prisma } from "@/lib/prisma";

const WORKER_ID = "deployment-worker-1";

export const workerHeartbeatService = {
  async heartbeat(workerId: string = WORKER_ID) {
    return prisma.workerHeartbeat.upsert({
      where: {
        workerId,
      },
      update: {
        lastSeen: new Date(),
      },
      create: {
        workerId,
      },
    });
  },

  async getHeartbeat() {
    return prisma.workerHeartbeat.findUnique({
      where: {
        workerId: WORKER_ID,
      },
    });
  },
};