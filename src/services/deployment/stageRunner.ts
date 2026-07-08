import { DeploymentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { DeploymentStage } from "./stages";
import { deploymentLogService } from "./logs/deploymentLogService";

export const stageRunner = {
  async run(
    deploymentId: string,
    stage: DeploymentStage,
    action: () => Promise<void>
  ) {
    const message = `Starting stage: ${stage}`;

    await deploymentLogService.append(
      deploymentId,
      message
    );

    console.log(`[${deploymentId}] ${message}`);

    try {
      await action();

      await deploymentLogService.append(
        deploymentId,
        `Completed stage: ${stage}`
      );

      console.log(
        `[${deploymentId}] Completed stage: ${stage}`
      );

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

      await prisma.deployment.update({
        where: {
          id: deploymentId,
        },
        data: {
          status: DeploymentStatus.FAILED,
        },
      });

      throw error;
    }
  },
};