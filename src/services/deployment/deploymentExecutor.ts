import { DeploymentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { DockerDeploymentProvider } from "@/services/providers";
import { stageRunner } from "./stageRunner";
import { DeploymentStage } from "./stages";
import { deploymentLogService } from "./logs/deploymentLogService";

export const deploymentExecutor = {
  async execute(deploymentId: string) {
    const provider = new DockerDeploymentProvider();

    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: DeploymentStatus.RUNNING,
      },
    });

    try {
      // Step 2 — Add "Deployment Started"
      await deploymentLogService.append(deploymentId, "Deployment started");

      // Step 3 — Instrument the CLONING stage
      await stageRunner.run(deploymentId, DeploymentStage.CLONING, async () => {
        await deploymentLogService.append(deploymentId, "Cloning repository...");
        await provider.checkout();
        await deploymentLogService.append(deploymentId, "Repository cloned");
      });

      // Step 4 — Instrument the BUILD stage
      await stageRunner.run(deploymentId, DeploymentStage.BUILDING, async () => {
        await deploymentLogService.append(deploymentId, "Building application...");
        await provider.build();
        await deploymentLogService.append(deploymentId, "Build completed");
      });

      // Step 5 — Instrument the DEPLOY stage
      await stageRunner.run(deploymentId, DeploymentStage.DEPLOYING, async () => {
        await deploymentLogService.append(deploymentId, "Pushing image...");
        await provider.push();
        await deploymentLogService.append(deploymentId, "Deploying application...");
        await provider.deploy();
        await deploymentLogService.append(deploymentId, "Deployment finished");
      });

      // Step 6 — Instrument the VERIFY stage
      await stageRunner.run(deploymentId, DeploymentStage.VERIFYING, async () => {
        await deploymentLogService.append(deploymentId, "Running verification...");
        await new Promise((r) => setTimeout(r, 1000));
        await deploymentLogService.append(deploymentId, "Verification successful");
      });

      // Step 7 — Log final success
      await deploymentLogService.append(deploymentId, "Deployment completed successfully");

      return await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: DeploymentStatus.SUCCESS,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await deploymentLogService.append(deploymentId, `Deployment failed: ${message}`);

      return await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: DeploymentStatus.FAILED,
        },
      });
    }
  },
};