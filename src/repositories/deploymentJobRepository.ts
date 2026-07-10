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
   * Claim the oldest pending deployment job using PostgreSQL row-level locking.
   * Ensures jobs that are scheduled for the future (nextRetryAt) are ignored.
   */
  async claimNextJob() {
    return prisma.$transaction(async (tx) => {
      const now = new Date();
      
      const jobs = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "DeploymentJob"
        WHERE status = 'PENDING'::"JobStatus"
        AND ("nextRetryAt" IS NULL OR "nextRetryAt" <= ${now})
        ORDER BY "createdAt" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `;

      if (jobs.length === 0) {
        return null;
      }

      const jobId = jobs[0].id;

      // Step 1: Update the status to RUNNING and clear the retry schedule
      return tx.deploymentJob.update({
        where: { id: jobId },
        data: { 
          status: JobStatus.RUNNING,
          nextRetryAt: null 
        },
      });
    });
  },

  /**
   * Update deployment job, optionally setting nextRetryAt.
   * Step 2: Explicitly handle undefined data to avoid overwriting with null/undefined.
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
        ...(data.nextRetryAt !== undefined && { nextRetryAt: data.nextRetryAt }),
        ...(data.startedAt !== undefined && { startedAt: data.startedAt }),
        ...(data.completedAt !== undefined && { completedAt: data.completedAt }),
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
        attempts: { increment: 1 },
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
      where: { deploymentId },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Find all pending jobs that are currently eligible for processing.
   */
  async findPending() {
    const now = new Date();
    return prisma.deploymentJob.findMany({
      where: {
        status: JobStatus.PENDING,
        OR: [
          { nextRetryAt: null },
          { nextRetryAt: { lte: now } }
        ]
      },
      orderBy: { createdAt: "asc" },
    });
  },

  /**
   * Reset a failed/running job back to pending.
   */
  async requeue(id: string) {
    return prisma.deploymentJob.update({
      where: { id },
      data: {
        status: JobStatus.PENDING,
        error: null,
        nextRetryAt: null,
      },
    });
  },

  /**
   * Schedule retry with delayed execution.
   */
  async scheduleRetry(id: string, retryAt: Date) {
    return prisma.deploymentJob.update({
      where: { id },
      data: {
        status: JobStatus.PENDING,
        nextRetryAt: retryAt,
      },
    });
  },

  /**
   * Permanently mark a job as failed.
   */
  async markFailed(id: string, error?: string) {
    return prisma.deploymentJob.update({
      where: { id },
      data: {
        status: JobStatus.FAILED,
        error: error ?? null,
        nextRetryAt: null,
      },
    });
  },

  /**
   * Delete a deployment job.
   */
  async delete(id: string) {
    return prisma.deploymentJob.delete({
      where: { id },
    });
  },
};