import { JobStatus } from "@/generated/prisma";
import { deploymentJobRepository } from "@/repositories/deploymentJobRepository";

export const deploymentJobService = {
  /**
   * Creates a deployment job.
   */
  async createJob(deploymentId: string) {
    if (!deploymentId) {
      throw new Error("Deployment ID is required");
    }

    return deploymentJobRepository.create(deploymentId);
  },

  /**
   * Claims the next pending deployment job.
   */
  async claimNextJob() {
    return deploymentJobRepository.claimNextJob();
  },

  /**
   * Updates the status of a deployment job.
   */
  async updateJob(
    id: string,
    status: JobStatus,
    error?: string
  ) {
    return deploymentJobRepository.update(id, {
      status,
      error,
    });
  },

  /**
   * Increments the retry attempt count.
   */
  async incrementAttempts(id: string) {
    return deploymentJobRepository.incrementAttempts(id);
  },

  /**
   * Finds a deployment job by ID.
   */
  async findJob(id: string) {
    return deploymentJobRepository.findById(id);
  },

  /**
   * Finds a deployment job by ID.
   */
  async findById(id: string) {
    return deploymentJobRepository.findById(id);
  },

  /**
   * Requeues a deployment job.
   */
  async requeueJob(id: string) {
    return deploymentJobRepository.requeue(id);
  },

  /**
   * Permanently marks a deployment job as failed.
   */
  async markFailed(id: string, error?: string) {
    return deploymentJobRepository.markFailed(id, error);
  },
};