import { DeploymentStage } from "./stages";

export const stageRunner = {
  async run(
    deploymentId: string,
    stage: DeploymentStage,
    action: () => Promise<void>
  ) {
    console.log(
      `[${deploymentId}] Starting stage: ${stage}`
    );

    try {
      await action();

      console.log(
        `[${deploymentId}] Completed stage: ${stage}`
      );
    } catch (error) {
      console.error(
        `[${deploymentId}] Failed stage: ${stage}`,
        error
      );

      throw error;
    }
  },
};