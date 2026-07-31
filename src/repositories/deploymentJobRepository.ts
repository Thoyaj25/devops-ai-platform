import {
  JobStatus,
  Prisma,
} from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

const defaultOrder: Prisma.DeploymentJobOrderByWithRelationInput = {
  createdAt: "asc",
};

type UpdateJobData = Prisma.DeploymentJobUpdateInput;

export const deploymentJobRepository = {
  async create(deploymentId: string) {
    return prisma.deploymentJob.create({
      data: {
        deploymentId,
        status: JobStatus.PENDING,
        attempts: 0,
      },
    });
  },

  /**
   * Atomically claims the oldest eligible deployment job.
   */
  async claimNextJob() {
    const now = new Date();

    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      UPDATE "DeploymentJob"
      SET
        status = 'RUNNING'::"JobStatus",
        "startedAt" = NOW(),
        "completedAt" = NULL,
        error = NULL,
        "nextRetryAt" = NULL
      WHERE id = (
        SELECT id
        FROM "DeploymentJob"
        WHERE
          status = 'PENDING'::"JobStatus"
          AND (
            "nextRetryAt" IS NULL
            OR "nextRetryAt" <= ${now}
          )
        ORDER BY "createdAt"
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id;
    `;

    if (rows.length === 0) {
      return null;
    }

    return prisma.deploymentJob.findUnique({
      where: {
        id: rows[0].id,
      },
    });
  },

  async update(
    id: string,
    data: UpdateJobData
  ) {
    return prisma.deploymentJob.update({
      where: { id },
      data,
    });
  },

  async incrementAttempts(id: string) {
    return prisma.deploymentJob.update({
      where: { id },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });
  },

  async findById(id: string) {
    return prisma.deploymentJob.findUnique({
      where: {
        id,
      },
    });
  },

  async findByDeploymentId(
    deploymentId: string
  ) {
    return prisma.deploymentJob.findMany({
      where: {
        deploymentId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  async findPending() {
    const now = new Date();

    return prisma.deploymentJob.findMany({
      where: {
        status: JobStatus.PENDING,
        OR: [
          {
            nextRetryAt: null,
          },
          {
            nextRetryAt: {
              lte: now,
            },
          },
        ],
      },
      orderBy: defaultOrder,
    });
  },

  async requeue(id: string) {
    return prisma.deploymentJob.update({
      where: {
        id,
      },
      data: {
        status: JobStatus.PENDING,
        error: null,
        startedAt: null,
        completedAt: null,
        nextRetryAt: null,
      },
    });
  },

  async scheduleRetry(
    id: string,
    retryAt: Date
  ) {
    return prisma.deploymentJob.update({
      where: {
        id,
      },
      data: {
        status: JobStatus.PENDING,
        error: null,
        completedAt: null,
        nextRetryAt: retryAt,
      },
    });
  },

  async markFailed(
    id: string,
    error?: string
  ) {
    return prisma.deploymentJob.update({
      where: {
        id,
      },
      data: {
        status: JobStatus.FAILED,
        error: error ?? null,
        completedAt: new Date(),
        nextRetryAt: null,
      },
    });
  },

  async requestCancellation(id: string) {
    return prisma.deploymentJob.update({
      where: {
        id,
      },
      data: {
        status: JobStatus.CANCEL_REQUESTED,
        cancelRequestedAt: new Date(),
      },
    });
  },

  async markCancelled(id: string) {
    return prisma.deploymentJob.update({
      where: {
        id,
      },
      data: {
        status: JobStatus.CANCELLED,
        completedAt: new Date(),
        nextRetryAt: null,
      },
    });
  },

  async delete(id: string) {
    return prisma.deploymentJob.delete({
      where: {
        id,
      },
    });
  },
};