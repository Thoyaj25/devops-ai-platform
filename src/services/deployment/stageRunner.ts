import { DeploymentStatus } from "@/generated/prisma";
import { deploymentRepository } from "@/repositories/deploymentRepository";
import { DeploymentStage } from "./stages";
import { deploymentLogService } from "./logs/deploymentLogService";

export const stageRunner = {
  async run<T>(
    deploymentId: string,
    stage: DeploymentStage,
    action: () => Promise<T>
  ): Promise<T> {
    const message = `Starting stage: ${stage}`;

    await deploymentLogService.append(deploymentId, message);
    console.log(`[${deploymentId}] ${message}`);

    try {
      const result = await action();

      await deploymentLogService.append(
        deploymentId,
        `Completed stage: ${stage}`
      );

      console.log(
        `[${deploymentId}] Completed stage: ${stage}`
      );

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error";

      await deploymentLogService.append(
        deploymentId,
        `Failed stage ${stage}: ${errorMessage}`
      );

      console.error(
        `[${deploymentId}] Failed stage: ${stage}`,
        error
      );

      await deploymentRepository.update(deploymentId, {
        status: DeploymentStatus.FAILED,
      });

      throw error;
    }
  },
};