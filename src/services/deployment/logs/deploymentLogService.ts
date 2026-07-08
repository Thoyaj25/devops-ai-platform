import { prisma } from "@/lib/prisma";

export const deploymentLogService = {
  async append(
    deploymentId: string,
    message: string
  ) {
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      select: { logs: true },
    });

    const existing = deployment?.logs ?? "";

    const timestamp = new Date().toISOString();

    const nextLog =
      existing +
      `[${timestamp}] ${message}\n`;

    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        logs: nextLog,
      },
    });
  },

  async getLogs(deploymentId: string) {
    return prisma.deployment.findUnique({
      where: {
        id: deploymentId,
      },
      select: {
        logs: true,
        status: true,
      },
    });
  },
};