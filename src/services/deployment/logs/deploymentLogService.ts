import { deploymentRepository } from "@/repositories/deploymentRepository";

const deploymentQueues = new Map<string, Promise<void>>();

export const deploymentLogService = {
  /**
   * Append a log entry sequentially for a deployment.
   * This prevents concurrent read-modify-write operations
   * against the Deployment.logs column.
   */
  async append(deploymentId: string, message: string): Promise<void> {
    const previous =
      deploymentQueues.get(deploymentId) ?? Promise.resolve();

    const current = previous.then(async () => {
      const deployment =
        await deploymentRepository.findLogs(deploymentId);

      const timestamp = new Date().toISOString();

      const updatedLogs =
        (deployment?.logs ?? "") +
        `[${timestamp}] ${message.trimEnd()}\n`;

      await deploymentRepository.updateLogs(
        deploymentId,
        updatedLogs
      );
    });

    // Keep the queue alive even if one write fails,
    // but still propagate the error to the caller.
    const queued = current.catch(() => {});

    deploymentQueues.set(deploymentId, queued);

    try {
      await current;
    } finally {
      if (deploymentQueues.get(deploymentId) === queued) {
        deploymentQueues.delete(deploymentId);
      }
    }
  },

  /**
   * Retrieve deployment logs.
   */
  async getLogs(deploymentId: string): Promise<string> {
    const deployment =
      await deploymentRepository.findLogs(deploymentId);

    return deployment?.logs ?? "";
  },
};