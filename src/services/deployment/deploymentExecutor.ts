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
import { cleanupCancelledDeployment } from "./cancellationCleanup";

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

    // 7. Generic failure cleanup & rollback wrapper
    try {
      await deploymentRollbackService.rollback(
        deploymentId,
        containerId
      );
    } catch (rollbackError) {
      logger.warn(
        {
          deploymentId,
          rollbackError,
        },
        "Rollback failed during deployment failure handling"
      );
    }

    try {
      await deploymentRepository.update(deploymentId, {
        status: DeploymentStatus.FAILED,
        isHealthy: false,
      });
    } catch (dbError) {
      logger.error(
        { deploymentId, dbError },
        "Failed to update deployment status to FAILED in database"
      );
    }
  },

  async execute(
    deploymentId: string,
    jobId: string
  ): Promise<void> {
    // 9. Add startup logging
    logger.info(
      { deploymentId, jobId },
      "Starting deployment execution pipeline"
    );

    const deployment =
      await deploymentRepository.findById(deploymentId);

    // 4. Validate deployment relations (Recommended)
    if (!deployment) {
      throw new Error("Deployment not found");
    }

    if (!deployment.pipeline) {
      throw new Error("Deployment pipeline was not loaded");
    }

    if (!deployment.project) {
      throw new Error("Deployment project was not loaded");
    }

    if (!deployment.environment) {
      throw new Error("Deployment environment was not loaded");
    }

    const repository = deployment.pipeline.repository;

    if (!repository?.trim()) {
      logger.error(
        {
          deploymentId: deployment.id,
          pipelineId: deployment.pipelineId,
        },
        "Pipeline repository is not configured"
      );

      throw new Error(
        `Pipeline ${deployment.pipelineId} has no repository configured`
      );
    }

    // 2. Branch validation
    const branch = deployment.pipeline.branch?.trim();

    if (!branch) {
      logger.error(
        {
          deploymentId,
          pipelineId: deployment.pipelineId,
        },
        "Pipeline branch is not configured"
      );

      throw new Error(
        `Pipeline ${deployment.pipelineId} has no branch configured`
      );
    }

    // 10. Log repository and branch
    logger.info(
      {
        deploymentId,
        repository,
        branch,
      },
      "Deployment repository and branch validated"
    );

    // 3. Validate image name
    const image = process.env.DOCKER_IMAGE?.trim();

    if (!image) {
      logger.error("DOCKER_IMAGE environment variable is not configured");
      throw new Error("DOCKER_IMAGE is not configured");
    }

    const provider =
      new DockerDeploymentProvider();

    const workspace =
      await workspaceService.prepare(deploymentId);

    let containerId: string | undefined;
    let runtime:
      | {
          containerId: string;
          containerName: string;
          hostPort: number;
          containerUrl: string;
        }
      | undefined;

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
              branch
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

          const imageName = `${image}:${deploymentId}`;
          await deploymentRepository.update(deploymentId, {
            image: imageName,
          });
        }
      );

      //
      // Deploy
      //
      await checkDeploymentCancellation(jobId);
      await throwIfCancellationRequested(jobId);

      runtime = await stageRunner.run(
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
              {
                path: deployment.project.healthCheckPath,
                port: deployment.project.healthCheckPort,
                startupTimeout: deployment.project.startupTimeout,
              },
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

      const deploymentRuntime = runtime;

      if (!deploymentRuntime) {
        throw new Error("Deployment runtime was not initialized");
      }

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
            deploymentRuntime.containerName
          );

          // final cancellation barrier
          await checkDeploymentCancellation(jobId);
          await throwIfCancellationRequested(jobId);

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
      // 5. Cancellation cleanup
      if (error instanceof DeploymentCancelledError) {
        logger.info(
          {
            deploymentId,
            jobId,
            containerId,
          },
          "Deployment cancellation requested"
        );

        await deploymentLogService.append(
          deploymentId,
          "Deployment cancelled by user"
        );

        try {
          await cleanupCancelledDeployment(
            runtime?.containerName
          );
        } catch (cleanupError) {
          logger.warn(
            { deploymentId, containerId, cleanupError },
            "Failed executing cancellation cleanup handler"
          );
        }

        await deploymentRepository.update(
  deploymentId,
  {
    status: DeploymentStatus.CANCELLED,
    isHealthy: false,
  }
);

throw error;
      }

      // 6. Timeout cleanup
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

      logger.error(
        {
          deploymentId,
          containerId,
          message,
          stack,
        },
        "Deployment execution failed with error"
      );

      await this.failDeployment(
        deploymentId,
        containerId,
        `Deployment failed:\n${message}`,
        stack
      );

      throw error;
    } finally {
      // 8. Workspace cleanup & 11. Wrap cleanup cleanly without any errors
      try {
        await workspaceService.cleanup(deploymentId);
      } catch (workspaceError) {
        logger.warn(
          { deploymentId, workspaceError },
          "Failed to clean up workspace successfully in finally block"
        );
      }
    }
  },
};
