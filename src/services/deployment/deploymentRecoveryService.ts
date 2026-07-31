import { logger } from "@/lib/logger";
import { config } from "@/lib/config";

import { deploymentJobService } from "./deploymentJobService";

export const deploymentRecoveryService = {
  async recoverStaleJobs() {
    const cutoff = new Date(
      Date.now() -
        config.workerRecoveryTimeoutSeconds * 1000
    );

    const jobs =
      await deploymentJobService.findRunningJobsOlderThan(
        cutoff
      );

    for (const job of jobs) {
      logger.warn(
        {
          jobId: job.id,
          deploymentId: job.deploymentId,
        },
        "Recovering stale deployment job"
      );

      await deploymentJobService.requeue(job.id);
    }
  },
};