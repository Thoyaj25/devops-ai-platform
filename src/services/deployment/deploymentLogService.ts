import { deploymentRepository } from "@/repositories/deploymentRepository";

export const deploymentLogService = {
  async append(deploymentId: string, message: string) {
    const deployment = await deploymentRepository.findLogs(deploymentId);
    const existing = deployment?.logs ?? "";
    const timestamp = new Date().toISOString();
    const nextLog = existing + `[${timestamp}] ${message}\n`;

    await deploymentRepository.updateLogs(deploymentId, nextLog);
  },

  async getLogs(deploymentId: string) {
    return deploymentRepository.findLogs(deploymentId);
  },
};