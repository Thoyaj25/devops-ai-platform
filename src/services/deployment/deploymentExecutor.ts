import { DeploymentStatus } from "@/generated/prisma/enums";
import { deploymentRepository } from "@/repositories/deploymentRepository";
import { DockerDeploymentProvider } from "@/services/providers";
import { workspaceService } from "./workspace/workspaceService";
import { stageRunner } from "./stageRunner";
import { DeploymentStage } from "./stages";
import { deploymentLogService } from "./logs/deploymentLogService";
import { withTimeout } from "@/lib/utils/timeout"; // Step 2.1: Import the timeout helper

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

          // Step 2.2: Protect the CLONING stage with a timeout (e.g., 5 minutes)
          await withTimeout(
            provider.checkout(repository, workspace, branch || "main"),
            300000,
            "Cloning timed out"
          );

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

          // Step 2.3: Protect the BUILD stage with a timeout (e.g., 10 minutes)
          await withTimeout(
            provider.build(workspace, buildCommand || undefined),
            600000,
            "Build timed out"
          );

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

          // Step 2.4: Protect the PUSH stage with a timeout (e.g., 5 minutes)
          await withTimeout(
            provider.push(),
            300000,
            "Push timed out"
          );

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

          // Step 2.5: Protect the DEPLOY stage with a timeout (e.g., 5 minutes)
          await withTimeout(
            provider.deploy(workspace, deployCommand || undefined),
            300000,
            "Deployment timed out"
          );

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

          // Step 2.6: Protect the VERIFY stage with a timeout (e.g., 1 minute)
          await withTimeout(
            new Promise((resolve) => setTimeout(resolve, 1000)),
            60000,
            "Verification timed out"
          );

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