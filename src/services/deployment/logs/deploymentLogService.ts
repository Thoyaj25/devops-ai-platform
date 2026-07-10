import { deploymentRepository } from "@/repositories/deploymentRepository";

export const deploymentLogService = {
  /**
   * Appends a new log entry to the deployment.
   */
  async append(deploymentId: string, message: string) {
    // 1. Fetch existing logs using the repository
    const deployment = await deploymentRepository.findLogs(deploymentId);
    const existing = deployment?.logs ?? "";

    // 2. Format the new log entry
    const timestamp = new Date().toISOString();
    const nextLog = existing + `[${timestamp}] ${message}\n`;

    // 3. Update logs using the repository
    await deploymentRepository.updateLogs(deploymentId, nextLog);
  },

  /**
   * Retrieves the log content for a deployment.
   */
  async getLogs(deploymentId: string) {
    const deployment = await deploymentRepository.findLogs(deploymentId);
    return deployment?.logs ?? "";
  },
};