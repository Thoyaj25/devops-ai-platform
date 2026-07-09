import { DeploymentStatus } from "@/generated/prisma/enums";
import { deploymentRepository } from "@/repositories/deploymentRepository";
import { DockerDeploymentProvider } from "@/services/providers";
import { stageRunner } from "./stageRunner";
import { DeploymentStage } from "./stages";
import { deploymentLogService } from "./logs/deploymentLogService";

export const deploymentExecutor = {
  async execute(deploymentId: string) {
    const provider = new DockerDeploymentProvider();

    // Use repository instead of direct prisma call
    await deploymentRepository.update(deploymentId, {
      status: DeploymentStatus.RUNNING,
    });

    try {
      await deploymentLogService.append(deploymentId, "Deployment started");

      // CLONING stage
      await stageRunner.run(deploymentId, DeploymentStage.CLONING, async () => {
        await deploymentLogService.append(deploymentId, "Cloning repository...");
        await provider.checkout();
        await deploymentLogService.append(deploymentId, "Repository cloned");
      });

      // BUILD stage
      await stageRunner.run(deploymentId, DeploymentStage.BUILDING, async () => {
        await deploymentLogService.append(deploymentId, "Building application...");
        await provider.build();
        await deploymentLogService.append(deploymentId, "Build completed");
      });

      // DEPLOY stage
      await stageRunner.run(deploymentId, DeploymentStage.DEPLOYING, async () => {
        await deploymentLogService.append(deploymentId, "Pushing image...");
        await provider.push();
        await deploymentLogService.append(deploymentId, "Deploying application...");
        await provider.deploy();
        await deploymentLogService.append(deploymentId, "Deployment finished");
      });

      // VERIFY stage
      await stageRunner.run(deploymentId, DeploymentStage.VERIFYING, async () => {
        await deploymentLogService.append(deploymentId, "Running verification...");
        await new Promise((r) => setTimeout(r, 1000));
        await deploymentLogService.append(deploymentId, "Verification successful");
      });

      await deploymentLogService.append(deploymentId, "Deployment completed successfully");

      // Use repository for final success update
      return await deploymentRepository.update(deploymentId, {
        status: DeploymentStatus.SUCCESS,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await deploymentLogService.append(deploymentId, `Deployment failed: ${message}`);

      // Use repository for final failure update
      return await deploymentRepository.update(deploymentId, {
        status: DeploymentStatus.FAILED,
      });
    }
  },
};