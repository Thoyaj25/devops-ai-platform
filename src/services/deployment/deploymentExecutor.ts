import { config } from "@/lib/config";
import { logger } from "@/lib/logger";
import { withTimeout } from "@/lib/utils/timeout";

import { DeploymentStatus } from "@/generated/prisma";

import { deploymentRepository } from "@/repositories/deploymentRepository";

import { DockerDeploymentProvider } from "@/services/providers";
import { proxyService } from "@/services/proxy/proxyService";

import { deploymentCleanupService } from "./deploymentCleanupService";
import { deploymentLogService } from "./logs/deploymentLogService";
import { deploymentRollbackService } from "./deploymentRollbackService";
import { stageRunner } from "./stageRunner";
import { DeploymentStage } from "./stages";
import { workspaceService } from "./workspace/workspaceService";

import { checkDeploymentCancellation } from "./cancellationService";
import { throwIfCancellationRequested } from "./throwIfCancellationRequested";

import { DeploymentCancelledError } from "./errors/deploymentCancelledError";
import { DeploymentTimeoutError } from "./errors/deploymentTimeoutError";

export const deploymentExecutor = {
  async failDeployment(
    deploymentId: string,
    containerId?: string,
    logMessage?: string,
    stack?: string
  ) {
    if (logMessage) {
      await deploymentLogService.append(deploymentId, logMessage);
    }

    if (stack) {
      await deploymentLogService.append(deploymentId, stack);
    }

    try {
      await deploymentRollbackService.rollback(
        deploymentId,
        containerId
      );
    } catch (rollbackError) {
      logger.warn({
        deploymentId,
        rollbackError,
      });
    }

    await deploymentRepository.update(deploymentId, {
      status: DeploymentStatus.FAILED,
      isHealthy: false,
    });
  },

  async execute(
    deploymentId: string,
    jobId: string
  ): Promise<void> {
    const deployment =
      await deploymentRepository.findById(deploymentId);

    if (!deployment) {
      throw new Error("Deployment not found");
    }

    const repository =
      deployment.pipeline.repository;

    if (!repository) {
      throw new Error("Deployment repository missing");
    }

    const image = process.env.DOCKER_IMAGE;

    if (!image) {
      throw new Error("DOCKER_IMAGE is not configured");
    }

    const provider =
      new DockerDeploymentProvider();

    const workspace =
      await workspaceService.prepare(deploymentId);

    let containerId: string | undefined;

    try {
      const previousDeployment =
        await deploymentRepository.findPreviousSuccessfulDeployment(
          deployment.projectId,
          deploymentId
        );

      //
      // Checkout
      //
      await checkDeploymentCancellation(jobId);
      await throwIfCancellationRequested(jobId);

      await stageRunner.run(
        deploymentId,
        DeploymentStage.CLONING,
        async () => {
          await deploymentRepository.update(deploymentId, {
            status: DeploymentStatus.CHECKING_OUT,
          });

          await withTimeout(
            provider.checkout(
              deploymentId,
              repository,
              workspace,
              deployment.pipeline.branch ?? "main"
            ),
            config.deploymentTimeouts.checkoutMs,
            "Repository checkout timed out"
          );
        }
      );

      //
      // Build
      //
      await checkDeploymentCancellation(jobId);
      await throwIfCancellationRequested(jobId);

      await stageRunner.run(
        deploymentId,
        DeploymentStage.BUILDING,
        async () => {
          await deploymentRepository.update(deploymentId, {
            status: DeploymentStatus.BUILDING,
          });

          await withTimeout(
            provider.build(
              deploymentId,
              workspace,
              jobId
            ),
            config.deploymentTimeouts.buildMs,
            "Docker build timed out"
          );
        }
      );

      //
      // Deploy
      //
      await checkDeploymentCancellation(jobId);
      await throwIfCancellationRequested(jobId);

      const runtime = await stageRunner.run(
        deploymentId,
        DeploymentStage.DEPLOYING,
        async () => {
          await deploymentRepository.update(deploymentId, {
            status: DeploymentStatus.DEPLOYING,
          });

          const result = await withTimeout(
            provider.deploy(
              deploymentId,
              workspace,
              image,
              deploymentId,
              jobId
            ),
            config.deploymentTimeouts.deployMs,
            "Container deployment timed out"
          );

          containerId = result.containerId;

          await deploymentRepository.update(deploymentId, {
            containerId: result.containerId,
            hostPort: result.hostPort,
            containerUrl: result.containerUrl,
          });

          return result;
        }
      );

      //
      // Verify
      //
      await checkDeploymentCancellation(jobId);
      await throwIfCancellationRequested(jobId);

      await stageRunner.run(
        deploymentId,
        DeploymentStage.VERIFYING,
        async () => {
          await deploymentRepository.update(deploymentId, {
            status: DeploymentStatus.HEALTH_CHECKING,
          });

          await deploymentLogService.append(
            deploymentId,
            "Running deployment health verification..."
          );

          await proxyService.exposeDeployment(
            deploymentId,
            runtime.containerName
          );

          await deploymentRepository.update(deploymentId, {
            status: DeploymentStatus.SUCCESS,
            isHealthy: true,
          });

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
      if (error instanceof DeploymentCancelledError) {
        logger.info(
          { deploymentId },
          "Deployment cancelled"
        );

        await deploymentLogService.append(
          deploymentId,
          "Deployment cancelled by user"
        );

        await deploymentRepository.update(
          deploymentId,
          {
            status: DeploymentStatus.CANCELLED,
            isHealthy: false,
          }
        );

        return;
      }

      if (error instanceof DeploymentTimeoutError) {
        logger.error(
          {
            deploymentId,
            containerId,
            message: error.message,
          },
          "Deployment timed out"
        );

        await this.failDeployment(
          deploymentId,
          containerId,
          `Deployment timed out:\n${error.message}`
        );

        throw error;
      }

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      const stack =
        error instanceof Error
          ? error.stack
          : undefined;

      logger.error({
        deploymentId,
        containerId,
        message,
        stack,
      });

      await this.failDeployment(
        deploymentId,
        containerId,
        `Deployment failed:\n${message}`,
        stack
      );

      throw error;
    } finally {
      await workspaceService.cleanup(
        deploymentId
      );
    }
  },
};