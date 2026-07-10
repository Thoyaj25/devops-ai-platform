import { JobStatus } from "@/generated/prisma";
import { logger } from "@/lib/logger";
import { workerHeartbeatService } from "@/services/worker/workerHeartbeatService";

import { deploymentExecutor } from "@/services/deployment/deploymentExecutor";
import { deploymentJobService } from "@/services/deployment/deploymentJobService";

/**
 * Processes deployment jobs one at a time.
 *
 * The worker repeatedly claims the oldest pending job.
 * If a job fails, it increments the attempt count and retries with exponential backoff.
 * If no jobs are found, it waits before checking again to prevent CPU spinning.
 */
export async function runDeploymentWorker(): Promise<void> {
  const MAX_RETRIES = 3;
  const workerId = "deployment-worker-1";
  let isShuttingDown = false;

  const heartbeatInterval = setInterval(async () => {
    try {
      await workerHeartbeatService.heartbeat(workerId);
      logger.info({ workerId }, "Worker heartbeat updated");
    } catch (error) {
      logger.error({ error, workerId }, "Failed to update worker heartbeat");
    }
  }, 10000);

  // Handle graceful shutdown signals
  process.on("SIGINT", () => { isShuttingDown = true; });
  process.on("SIGTERM", () => { isShuttingDown = true; });

  while (!isShuttingDown) {
    // Atomically claim the next pending job (includes retry eligibility check)
    const job = await deploymentJobService.claimNextJob();

    if (!job) {
      // Small sleep if no jobs are available to prevent tight loops
      await new Promise((resolve) => setTimeout(resolve, 5000));
      continue;
    }

    try {
      logger.info(
        {
          jobId: job.id,
          deploymentId: job.deploymentId,
          attempt: job.attempts + 1,
        },
        "Starting deployment job"
      );

      await deploymentJobService.updateJob(job.id, {
        status: JobStatus.RUNNING,
        startedAt: new Date(),
      });

      await deploymentExecutor.execute(job.deploymentId);

      await deploymentJobService.updateJob(job.id, {
        status: JobStatus.COMPLETED,
        completedAt: new Date(), 
      });

      logger.info({ jobId: job.id }, "Deployment job completed successfully");
    } catch (error) {
      // Increment attempt count
      await deploymentJobService.incrementAttempts(job.id);
      const updatedJob = await deploymentJobService.findById(job.id);
      const attempts = updatedJob?.attempts || 0;

      logger.error(
        {
          error,
          jobId: job.id,
          attempt: attempts,
        },
        "Deployment job failed"
      );

      if (attempts < MAX_RETRIES) {
        // Calculate exponential backoff: 20s, 40s, 80s... (based on attempts)
        const retryDelaySeconds = Math.pow(2, attempts) * 10;
        const nextRetryAt = new Date(Date.now() + retryDelaySeconds * 1000);

        // Schedule for retry using the service helper
        await deploymentJobService.scheduleRetry(job.id, nextRetryAt);

        logger.info(
          { jobId: job.id, retryAt: nextRetryAt },
          "Deployment job scheduled for retry"
        );
      } else {
        await deploymentJobService.updateJob(job.id, {
          status: JobStatus.FAILED,
          error: error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date(),
        });
        logger.error({ jobId: job.id }, "Deployment job permanently failed after max retries");
      }
    }
  }
  
  clearInterval(heartbeatInterval);
  logger.info("Deployment worker shutting down gracefully.");
}