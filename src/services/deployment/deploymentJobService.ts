import { deploymentJobRepository } from "@/repositories/deploymentJobRepository";

type DeploymentJobStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export const deploymentJobService = {
  /**
   * Creates a new deployment job.
   */
  async createJob(deploymentId: string) {
    if (!deploymentId) {
      throw new Error("Deployment ID is required");
    }
    return deploymentJobRepository.create(deploymentId);
  },

  /**
   * Fetches all jobs with a 'PENDING' status.
   */
  async getPendingJobs() {
    return deploymentJobRepository.findPending();
  },

  /**
   * Updates the status of a specific job.
   */
  async updateJob(
    id: string,
    status: DeploymentJobStatus,
    error?: string
  ) {
    return deploymentJobRepository.update(id, {
      status,
      error,
    });
  },
};