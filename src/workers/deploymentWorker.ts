import { deploymentJobService } from "@/services/deployment/deploymentJobService";
import { deploymentExecutor } from "@/services/deployment/deploymentExecutor";
import { logger } from "@/lib/logger";

/**
 * Step 2 — Verify the worker export
 * 
 * Orchestrates the processing of pending deployment jobs.
 * This function is designed to be exported and invoked by 
 * the worker API route or a background task runner.
 */
export async function runDeploymentWorker() {
  const jobs = await deploymentJobService.getPendingJobs();

  if (jobs.length === 0) {
    return;
  }

  for (const job of jobs) {
    try {
      logger.info({ jobId: job.id }, "Starting deployment job");

      await deploymentJobService.updateJob(job.id, "RUNNING");

      await deploymentExecutor.execute(job.deploymentId);

      await deploymentJobService.updateJob(job.id, "COMPLETED");
      
      logger.info({ jobId: job.id }, "Deployment job completed successfully");
    } catch (error) {
      logger.error({ error, jobId: job.id }, "Deployment job failed");

      await deploymentJobService.updateJob(
        job.id,
        "FAILED",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
}