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

  /**
   * Claims the oldest pending job.
   * Returns null if there are no pending jobs.
   */
  async claimNextJob() {
    return prisma.$transaction(async (tx) => {
      const job = await tx.deploymentJob.findFirst({
        where: {
          status: JobStatus.PENDING,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      if (!job) {
        return null;
      }

      return tx.deploymentJob.update({
        where: {
          id: job.id,
        },
        data: {
          status: JobStatus.RUNNING,
        },
      });
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

  /**
   * Fetches all jobs currently in a PENDING status.
   */
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

  /**
   * Increments the attempt count for a specific deployment job.
   */
  async incrementAttempts(id: string) {
    return prisma.deploymentJob.update({
      where: {
        id,
      },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });
  },

  /**
   * Retrieves a job by its unique identifier.
   */
  async findById(id: string) {
    return prisma.deploymentJob.findUnique({
      where: {
        id,
      },
    });
  },

  /**
   * Retrieves all jobs associated with a specific deployment.
   */
  async findByDeploymentId(deploymentId: string) {
    return prisma.deploymentJob.findMany({
      where: {
        deploymentId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  /**
   * Requeues a job by resetting its status to PENDING.
   */
  async requeue(id: string) {
    return prisma.deploymentJob.update({
      where: {
        id,
      },
      data: {
        status: JobStatus.PENDING,
      },
    });
  },

  /**
   * Marks a job as failed with an error message.
   */
  async markFailed(id: string, error?: string) {
    return prisma.deploymentJob.update({
      where: {
        id,
      },
      data: {
        status: JobStatus.FAILED,
        error: error,
      },
    });
  },
};