import { DeploymentStage } from "./stages";

export const logService = {
  async append(deploymentId: string, message: string) {
    console.log(`[${deploymentId}] ${message}`);
  },
};

export const stageRunner = {
  async run(
    deploymentId: string,
    stage: DeploymentStage,
    action: () => Promise<void>
  ) {
    await logService.append(deploymentId, `Starting ${stage}`);

    try {
      await action();

      await logService.append(deploymentId, `Completed ${stage}`);
    } catch (error) {
      await logService.append(deploymentId, `Failed ${stage}`);

      throw error;
    }
  },
};