import { config } from "@/lib/config";
import { logger } from "@/lib/logger";
import { withTimeout } from "@/lib/utils/timeout";

import { DeploymentStatus } from "@/generated/prisma";

import { deploymentRepository } from "@/repositories/deploymentRepository";

import { DockerDeploymentProvider } from "@/services/providers";

import { proxyService } from "@/services/proxy/proxyService";

import { deploymentLogService } from "./logs/deploymentLogService";
import { deploymentCleanupService } from "./deploymentCleanupService";
import { stageRunner } from "./stageRunner";
import { DeploymentStage } from "./stages";
import { workspaceService } from "./workspace/workspaceService";

export const deploymentExecutor = {
  async execute(deploymentId: string): Promise<void> {
    const deployment =
      await deploymentRepository.findById(deploymentId);

    if (!deployment) {
      throw new Error("Deployment not found");
    }

    if (!deployment.pipeline.repository) {
      throw new Error("Deployment repository missing");
    }

    const provider = new DockerDeploymentProvider();

    const workspace =
      await workspaceService.prepare(deploymentId);

    let containerId: string | undefined;

    try {
      //---------------------------------------------------------
      // Previous deployment
      //---------------------------------------------------------

      const previousDeployment =
        await deploymentRepository.findPreviousSuccessfulDeployment(
          deployment.projectId,
          deploymentId
        );

      //---------------------------------------------------------
      // Clone
      //---------------------------------------------------------

      await stageRunner.run(
        deploymentId,
        DeploymentStage.CLONING,
        async () => {
          await withTimeout(
            provider.checkout(
              deploymentId,
              deployment.pipeline.repository!,
              workspace,
              deployment.pipeline.branch ?? "main"
            ),
            300_000,
            "Repository checkout timed out"
          );
        }
      );

      //---------------------------------------------------------
      // Build
      //---------------------------------------------------------

      await stageRunner.run(
        deploymentId,
        DeploymentStage.BUILDING,
        async () => {
          await withTimeout(
            provider.build(
              deploymentId,
              workspace,
              deployment.pipeline.buildCommand ?? undefined
            ),
            600_000,
            "Application build timed out"
          );
        }
      );

      //---------------------------------------------------------
      // Deploy
      //---------------------------------------------------------

      const image = process.env.DOCKER_IMAGE;

      if (!image) {
        throw new Error("DOCKER_IMAGE is not configured");
      }

      const runtime =
        await stageRunner.run(
          deploymentId,
          DeploymentStage.DEPLOYING,
          async () => {
            const result =
              await withTimeout(
                provider.deploy(
                  deploymentId,
                  workspace,
                  image,
                  deploymentId,
                  deployment.pipeline.deployCommand ?? undefined
                ),
                300_000,
                "Container deployment timed out"
              );

            containerId = result.containerId;

            await deploymentRepository.update(
              deploymentId,
              {
                containerId: result.containerId,
                hostPort: result.hostPort,
                containerUrl: result.containerUrl,
              }
            );

            return result;
          }
        );

      //---------------------------------------------------------
      // Verify
      //---------------------------------------------------------

      await stageRunner.run(
        deploymentId,
        DeploymentStage.VERIFYING,
        async () => {
          await deploymentLogService.append(
            deploymentId,
            "Running deployment health verification..."
          );

          await proxyService.exposeDeployment(
            deploymentId,
            runtime.containerName
          );

          await deploymentRepository.update(
            deploymentId,
            {
              status: DeploymentStatus.SUCCESS,
              isHealthy: true,
            }
          );

          await deploymentLogService.append(
            deploymentId,
            `Deployment available at http://${deploymentId}.${config.deploymentDomain}`
          );

          if (previousDeployment) {
            await deploymentCleanupService.cleanupPreviousDeployment(
              previousDeployment.id
            );
          }
        }
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      const stack =
        error instanceof Error
          ? error.stack
          : undefined;

      //---------------------------------------------------------
      // Console logging
      //---------------------------------------------------------

      logger.error({
        deploymentId,
        containerId,
        message,
        stack,
      });

      //---------------------------------------------------------
      // Deployment log
      //---------------------------------------------------------

      await deploymentLogService.append(
        deploymentId,
        `Deployment failed:\n${message}`
      );

      if (stack) {
        await deploymentLogService.append(
          deploymentId,
          stack
        );
      }

      //---------------------------------------------------------
      // Cleanup exposed proxy
      //---------------------------------------------------------

      if (containerId) {
        try {
          await proxyService.removeDeployment(
            deploymentId
          );
        } catch (cleanupError) {
          logger.warn({
            deploymentId,
            cleanupError,
          });
        }
      }

      //---------------------------------------------------------
      // Update database
      //---------------------------------------------------------

      await deploymentRepository.update(
        deploymentId,
        {
          status: DeploymentStatus.FAILED,
          isHealthy: false,
        }
      );

      throw error;
    } finally {
      //---------------------------------------------------------
      // Cleanup workspace
      //---------------------------------------------------------

      await workspaceService.cleanup(deploymentId);
    }
  },
};