import { JobStatus } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export const deploymentJobRepository = {
  async create(deploymentId: string) {
    return prisma.deploymentJob.create({
      data: {
        deploymentId,
        status: JobStatus.PENDING,
      },
    });
  },

  async findPending() {
    return prisma.deploymentJob.findMany({
      where: {
        status: JobStatus.PENDING,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  },

  async update(
    id: string,
    data: {
      status: JobStatus;
      error?: string;
    }
  ) {
    return prisma.deploymentJob.update({
      where: {
        id,
      },
      data: {
        status: data.status,
        error: data.error,
      },
    });
  },
};