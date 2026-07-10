// Updated to import from the generated Prisma output
import { JobStatus } from "@/generated/prisma"; 
import { deploymentJobRepository } from "@/repositories/deploymentJobRepository";

export const deploymentJobService = {
  /**
   * Creates a new deployment job record.
   */
  async createJob(deploymentId: string) {
    if (!deploymentId) {
      throw new Error("Deployment ID is required");
    }

    return deploymentJobRepository.create(deploymentId);
  },

  /**
   * Fetches all jobs currently in a PENDING status.
   */
  async getPendingJobs() {
    return deploymentJobRepository.findPending();
  },

  /**
   * Updates the status and optional error message of a job.
   */
  async updateJob(
    id: string,
    status: JobStatus,
    error?: string
  ) {
    // Ensure the repository method is called with the expected structure
    return deploymentJobRepository.update(id, {
      status,
      error,
    });
  },
};