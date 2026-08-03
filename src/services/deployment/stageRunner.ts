import { DeploymentStatus } from "@/generated/prisma";

import { deploymentRepository } from "@/repositories/deploymentRepository";

import { DeploymentStage } from "./stages";
import { deploymentLogService } from "./logs/deploymentLogService";
import { DeploymentCancelledError } from "./errors/deploymentCancelledError";

const stageStatusMap: Partial<
  Record<DeploymentStage, DeploymentStatus>
> = {
  [DeploymentStage.CLONING]:
    DeploymentStatus.CHECKING_OUT,

  [DeploymentStage.BUILDING]:
    DeploymentStatus.BUILDING,

  [DeploymentStage.DEPLOYING]:
    DeploymentStatus.DEPLOYING,

  [DeploymentStage.VERIFYING]:
    DeploymentStatus.HEALTH_CHECKING,
};

export const stageRunner = {
  async run<T>(
    deploymentId: string,
    stage: DeploymentStage,
    action: () => Promise<T>
  ): Promise<T> {
    const status = stageStatusMap[stage];

    if (status) {
      await deploymentRepository.update(deploymentId, {
        status,
      });
    }

    await deploymentLogService.append(
      deploymentId,
      `Starting stage: ${stage}`,
      stage
    );

    try {
      const result = await action();

      await deploymentLogService.append(
        deploymentId,
        `Completed stage: ${stage}`,
        stage
      );

      return result;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error";

      await deploymentLogService.append(
        deploymentId,
        `Failed stage ${stage}: ${message}`,
        stage
      );

      // Cancellation is NOT a deployment failure.
      // Let deploymentExecutor handle the final state.
      if (error instanceof DeploymentCancelledError) {
        throw error;
      }

      await deploymentRepository.update(deploymentId, {
        status: DeploymentStatus.FAILED,
      });

      throw error;
    }
  },
};