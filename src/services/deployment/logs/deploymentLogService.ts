import { prisma } from "@/lib/prisma";

const deploymentQueues = new Map<string, Promise<void>>();

export const deploymentLogService = {

  /**
   * Store deployment log entry.
   */
  async append(
    deploymentId: string,
    message: string,
    stage?: string
  ): Promise<void> {

    const previous =
      deploymentQueues.get(deploymentId) ??
      Promise.resolve();


    const current = previous.then(async () => {

      await prisma.deploymentLog.create({
        data: {
          deploymentId,
          stage,
          message: message.trimEnd(),
        },
      });

    });


    const queued = current.catch(() => {});

    deploymentQueues.set(
      deploymentId,
      queued
    );


    try {
      await current;
    }
    finally {

      if (
        deploymentQueues.get(deploymentId)
        === queued
      ) {
        deploymentQueues.delete(
          deploymentId
        );
      }

    }
  },


  /**
   * Fetch deployment logs.
   */
  async getLogs(
    deploymentId: string
  ) {

    return prisma.deploymentLog.findMany({
      where:{
        deploymentId,
      },

      orderBy:{
        createdAt:"asc",
      },

    });

  },

};