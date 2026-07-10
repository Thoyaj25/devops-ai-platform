import { JobStatus } from "@/generated/prisma";
import { logger } from "@/lib/logger";

import { deploymentExecutor } from "@/services/deployment/deploymentExecutor";
import { deploymentJobService } from "@/services/deployment/deploymentJobService";

/**
 * Processes deployment jobs one at a time.
 *
 * The worker repeatedly claims the oldest pending job.
 * If a job fails, it increments the attempt count and retries up to 3 times.
 * Once no pending jobs remain, the worker exits.
 */
export async function runDeploymentWorker(): Promise<void> {
  const MAX_RETRIES = 3;

  while (true) {
    // Atomically claim the next pending job
    const job = await deploymentJobService.claimNextJob();

    if (!job) {
      logger.info("No pending deployment jobs found.");
      break;
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

      await deploymentExecutor.execute(job.deploymentId);

      await deploymentJobService.updateJob(job.id, JobStatus.COMPLETED);

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
        // Reset to PENDING so it can be picked up again
        await deploymentJobService.updateJob(job.id, JobStatus.PENDING);
        logger.info({ jobId: job.id }, "Retrying deployment job");
      } else {
        // Mark as FAILED after max retries
        await deploymentJobService.updateJob(
          job.id,
          JobStatus.FAILED,
          error instanceof Error ? error.message : "Unknown error"
        );
        logger.error({ jobId: job.id }, "Deployment job permanently failed after max retries");
      }
    }
  }
}