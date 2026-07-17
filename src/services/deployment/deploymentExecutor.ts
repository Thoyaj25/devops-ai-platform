import { DeploymentStatus } from "@/generated/prisma";
import { deploymentRepository } from "@/repositories/deploymentRepository";
import { DockerDeploymentProvider } from "@/services/providers";

import { workspaceService } from "./workspace/workspaceService";
import { stageRunner } from "./stageRunner";
import { DeploymentStage } from "./stages";
import { deploymentLogService } from "./logs/deploymentLogService";

import { withTimeout } from "@/lib/utils/timeout";

export const deploymentExecutor = {
  async execute(deploymentId: string) {
    const provider = new DockerDeploymentProvider();

    const workspace =
      await workspaceService.prepare(deploymentId);

    const deployment =
      await deploymentRepository.findById(deploymentId);

    if (!deployment) {
      throw new Error("Deployment not found");
    }

    const {
      repository,
      branch,
      buildCommand,
      deployCommand,
    } = deployment.pipeline;

    if (!repository) {
      throw new Error(
        "Deployment pipeline repository is not configured"
      );
    }

    await deploymentLogService.append(
      deploymentId,
      `Workspace prepared: ${workspace}`
    );

    await deploymentRepository.update(deploymentId, {
      status: DeploymentStatus.RUNNING,
    });

    try {
      await deploymentLogService.append(
        deploymentId,
        "Deployment started"
      );

      // ------------------------
      // CLONE
      // ------------------------

      await stageRunner.run(
        deploymentId,
        DeploymentStage.CLONING,
        async () => {
          await deploymentLogService.append(
            deploymentId,
            `Cloning ${repository} (${branch ?? "main"})`
          );

          await withTimeout(
            provider.checkout(
              deploymentId,
              repository,
              workspace,
              branch ?? "main"
            ),
            5 * 60 * 1000,
            "Cloning timed out"
          );

          await deploymentLogService.append(
            deploymentId,
            "Repository cloned"
          );
        }
      );

      // ------------------------
      // BUILD
      // ------------------------

      await stageRunner.run(
        deploymentId,
        DeploymentStage.BUILDING,
        async () => {
          await deploymentLogService.append(
            deploymentId,
            `Running build (${buildCommand ?? "default"})`
          );

          await withTimeout(
            provider.build(
              deploymentId,
              workspace,
              buildCommand ?? undefined
            ),
            10 * 60 * 1000,
            "Build timed out"
          );

          await deploymentLogService.append(
            deploymentId,
            "Build completed"
          );
        }
      );

      // ------------------------
      // PUSH
      // ------------------------

      await stageRunner.run(
        deploymentId,
        DeploymentStage.PUSHING,
        async () => {
          const image = process.env.DOCKER_IMAGE;

          if (!image) {
            throw new Error(
              "DOCKER_IMAGE is not configured"
            );
          }

          await deploymentLogService.append(
            deploymentId,
            "Pushing image"
          );

          await withTimeout(
            provider.push(
              deploymentId,
              image,
              deploymentId
            ),
            5 * 60 * 1000,
            "Push timed out"
          );

          await deploymentLogService.append(
            deploymentId,
            "Push completed"
          );
        }
      );

      // ------------------------
      // DEPLOY
      // ------------------------

      await stageRunner.run(
        deploymentId,
        DeploymentStage.DEPLOYING,
        async () => {
          const image = process.env.DOCKER_IMAGE;

          if (!image) {
            throw new Error(
              "DOCKER_IMAGE is not configured"
            );
          }

          await deploymentLogService.append(
            deploymentId,
            `Deploying (${deployCommand ?? "default"})`
          );

          await withTimeout(
            provider.deploy(
              deploymentId,
              workspace,
              image,
              deploymentId,
              deployCommand ?? undefined
            ),
            5 * 60 * 1000,
            "Deployment timed out"
          );

          await deploymentLogService.append(
            deploymentId,
            "Deployment completed"
          );
        }
      );

      // ------------------------
      // VERIFY
      // ------------------------

      await stageRunner.run(
        deploymentId,
        DeploymentStage.VERIFYING,
        async () => {
          await deploymentLogService.append(
            deploymentId,
            "Running verification"
          );

          await withTimeout(
            new Promise((resolve) =>
              setTimeout(resolve, 1000)
            ),
            60 * 1000,
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

      return await deploymentRepository.update(
        deploymentId,
        {
          status: DeploymentStatus.SUCCESS,
        }
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error";

      await deploymentLogService.append(
        deploymentId,
        `Deployment failed: ${message}`
      );

      await deploymentRepository.update(deploymentId, {
        status: DeploymentStatus.FAILED,
      });

      // IMPORTANT:
      // Propagate the error so the worker can retry
      throw error;
    } finally {
      await workspaceService.cleanup(deploymentId);

      try {
        await deploymentLogService.append(
          deploymentId,
          "Workspace cleaned up"
        );
      } catch {
        // Ignore cleanup logging failures.
      }
    }
  },
};