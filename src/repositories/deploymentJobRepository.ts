import { JobStatus } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export const deploymentJobRepository = {
  /**
   * Create a new deployment job.
   */
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
   * Atomically claim the oldest pending deployment job.
   *
   * Uses a single UPDATE ... FROM ... RETURNING statement to avoid
   * interactive transactions and race conditions.
   */
  async claimNextJob() {
    const now = new Date();

    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      UPDATE "DeploymentJob"
      SET
        status = 'RUNNING'::"JobStatus",
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

  /**
   * Update deployment job.
   */
  async update(
    id: string,
    data: {
      status?: JobStatus;
      error?: string | null;
      nextRetryAt?: Date | null;
      startedAt?: Date | null;
      completedAt?: Date | null;
    }
  ) {
    return prisma.deploymentJob.update({
      where: { id },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.error !== undefined && { error: data.error }),
        ...(data.nextRetryAt !== undefined && {
          nextRetryAt: data.nextRetryAt,
        }),
        ...(data.startedAt !== undefined && {
          startedAt: data.startedAt,
        }),
        ...(data.completedAt !== undefined && {
          completedAt: data.completedAt,
        }),
      },
    });
  },

  /**
   * Increment retry attempts.
   */
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

  /**
   * Find job by ID.
   */
  async findById(id: string) {
    return prisma.deploymentJob.findUnique({
      where: { id },
    });
  },

  /**
   * Find all jobs for a deployment.
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
   * Find all pending jobs currently eligible for processing.
   */
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
      orderBy: {
        createdAt: "asc",
      },
    });
  },

  /**
   * Reset a job back to pending.
   */
  async requeue(id: string) {
    return prisma.deploymentJob.update({
      where: {
        id,
      },
      data: {
        status: JobStatus.PENDING,
        error: null,
        nextRetryAt: null,
      },
    });
  },

  /**
   * Schedule retry.
   */
  async scheduleRetry(id: string, retryAt: Date) {
    return prisma.deploymentJob.update({
      where: {
        id,
      },
      data: {
        status: JobStatus.PENDING,
        nextRetryAt: retryAt,
      },
    });
  },

  /**
   * Mark job permanently failed.
   */
  async markFailed(id: string, error?: string) {
    return prisma.deploymentJob.update({
      where: {
        id,
      },
      data: {
        status: JobStatus.FAILED,
        error: error ?? null,
        nextRetryAt: null,
      },
    });
  },

  /**
   * Delete job.
   */
  async delete(id: string) {
    return prisma.deploymentJob.delete({
      where: {
        id,
      },
    });
  },
};