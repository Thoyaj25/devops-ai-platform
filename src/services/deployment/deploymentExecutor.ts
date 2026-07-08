import { DeploymentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { DockerDeploymentProvider } from "@/services/providers";
import { stageRunner } from "./stageRunner";
import { DeploymentStage } from "./stages";

export const deploymentExecutor = {
  async execute(deploymentId: string) {
    const provider = new DockerDeploymentProvider();

    await prisma.deployment.update({
      where: { id: deploymentId },
      data: { status: DeploymentStatus.RUNNING },
    });

    try {
      await stageRunner.run(deploymentId, DeploymentStage.CLONING, async () => {
        await provider.checkout();
      });

      await stageRunner.run(deploymentId, DeploymentStage.BUILDING, async () => {
        await provider.build();
      });

      await stageRunner.run(deploymentId, DeploymentStage.DEPLOYING, async () => {
        await provider.push();
        await provider.deploy();
      });

      await stageRunner.run(deploymentId, DeploymentStage.VERIFYING, async () => {
        // Add verification logic if available in provider
      });

      return await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: DeploymentStatus.SUCCESS,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      return await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: DeploymentStatus.FAILED,
        },
      });
    }
  },
};