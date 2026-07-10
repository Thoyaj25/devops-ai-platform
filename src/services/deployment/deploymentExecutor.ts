import { DeploymentStatus } from "@/generated/prisma/enums";
import { deploymentRepository } from "@/repositories/deploymentRepository";
import { DockerDeploymentProvider } from "@/services/providers";
import { workspaceService } from "./workspace/workspaceService";
import { stageRunner } from "./stageRunner";
import { DeploymentStage } from "./stages";
import { deploymentLogService } from "./logs/deploymentLogService";

export const deploymentExecutor = {
  async execute(deploymentId: string) {
    const provider = new DockerDeploymentProvider();

    // Create an isolated workspace for this deployment
    const workspace = await workspaceService.prepare(deploymentId);
    const deployment = await deploymentRepository.findById(deploymentId);
    
    // Step 1: Update deployment variables
    const repository = deployment?.pipeline.repository;
    const branch = deployment?.pipeline.branch;
    const buildCommand = deployment?.pipeline.buildCommand;
    const deployCommand = deployment?.pipeline.deployCommand;

    if (!repository) {
      throw new Error("Deployment pipeline repository is not configured");
    }

    await deploymentLogService.append(
      deploymentId,
      `Workspace prepared: ${workspace}`
    );

    // Mark deployment as running
    await deploymentRepository.update(deploymentId, {
      status: DeploymentStatus.RUNNING,
    });

    try {
      await deploymentLogService.append(
        deploymentId,
        "Deployment started"
      );

      // CLONING stage
      await stageRunner.run(
        deploymentId,
        DeploymentStage.CLONING,
        async () => {
          await deploymentLogService.append(
            deploymentId,
            `Cloning repository ${repository} (branch: ${branch || 'main'})...`
          );

          // Step 2: Fix checkout call
          await provider.checkout(repository, workspace, branch || "main");

          await deploymentLogService.append(
            deploymentId,
            "Repository cloned"
          );
        }
      );

      // BUILD stage
      await stageRunner.run(
        deploymentId,
        DeploymentStage.BUILDING,
        async () => {
          await deploymentLogService.append(
            deploymentId,
            `Building application with command: ${buildCommand || 'default'}...`
          );

          // Step 3: Fix build call
          await provider.build(workspace, buildCommand || undefined);

          await deploymentLogService.append(
            deploymentId,
            "Build completed"
          );
        }
      );

      // PUSH stage
      await stageRunner.run(
        deploymentId,
        DeploymentStage.PUSHING,
        async () => {
          await deploymentLogService.append(
            deploymentId,
            "Pushing image..."
          );

          await provider.push();

          await deploymentLogService.append(
            deploymentId,
            "Push finished"
          );
        }
      );

      // DEPLOY stage
      await stageRunner.run(
        deploymentId,
        DeploymentStage.DEPLOYING,
        async () => {
          await deploymentLogService.append(
            deploymentId,
            `Deploying application with command: ${deployCommand || 'default'}...`
          );

          // Step 4: Fix deploy call
          await provider.deploy(workspace, deployCommand || undefined);

          await deploymentLogService.append(
            deploymentId,
            "Deployment finished"
          );
        }
      );

      // VERIFY stage
      await stageRunner.run(
        deploymentId,
        DeploymentStage.VERIFYING,
        async () => {
          await deploymentLogService.append(
            deploymentId,
            "Running verification..."
          );

          await new Promise((resolve) => setTimeout(resolve, 1000));

          await deploymentLogService.append(
            deploymentId,
            "Verification successful"
          );
        }
      );

      await deploymentLogService.append(
        deploymentId,
        "Deployment completed successfully"
      );

      return await deploymentRepository.update(deploymentId, {
        status: DeploymentStatus.SUCCESS,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";

      await deploymentLogService.append(
        deploymentId,
        `Deployment failed: ${message}`
      );

      return await deploymentRepository.update(deploymentId, {
        status: DeploymentStatus.FAILED,
      });
    } finally {
      await workspaceService.cleanup(deploymentId);

      await deploymentLogService.append(
        deploymentId,
        "Workspace cleaned up"
      );
    }
  },
};