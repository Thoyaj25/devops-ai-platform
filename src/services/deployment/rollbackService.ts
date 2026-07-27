import { DeploymentStatus } from "@/generated/prisma";
import { logger } from "@/lib/logger";

import { deploymentRepository } from "@/repositories/deploymentRepository";

import { DockerDeploymentProvider } from "@/services/providers";
import { proxyService } from "@/services/proxy/proxyService";
import { deploymentLogService } from "./logs/deploymentLogService";

export const rollbackService = {
  async rollback(
    deploymentId: string | undefined,
    previousDeploymentId: string | undefined
  ) {
    if (!deploymentId || !previousDeploymentId) {
      throw new Error("Both deploymentId and previousDeploymentId are required");
    }

    const provider = new DockerDeploymentProvider();

    const failedDeployment =
      await deploymentRepository.findById(deploymentId);

    if (!failedDeployment) {
      throw new Error("Deployment not found");
    }

    const previousDeployment =
      await deploymentRepository.findById(previousDeploymentId);

    if (!previousDeployment) {
      throw new Error("Previous deployment not found");
    }

    if (
      previousDeployment.projectId !==
      failedDeployment.projectId
    ) {
      throw new Error(
        "Rollback deployment belongs to another project."
      );
    }

    if (!previousDeployment.containerId) {
      throw new Error(
        "Rollback deployment has no container."
      );
    }

    if (
      previousDeployment.status !== DeploymentStatus.SUCCESS &&
      previousDeployment.status !== DeploymentStatus.SUPERSEDED
    ) {
      throw new Error(
        `Deployment ${previousDeploymentId} cannot be used for rollback.`
      );
    }

    await deploymentRepository.update(deploymentId, {
      status: DeploymentStatus.ROLLING_BACK,
      isHealthy: false,
    });

    await deploymentLogService.append(
      deploymentId,
      `Rolling back to deployment ${previousDeploymentId}`
    );

    try {
      //
      // Start previous container
      //

      await deploymentLogService.append(
        deploymentId,
        "Starting previous deployment container..."
      );

      await provider.start(previousDeployment.containerId);

      //
      // Verify container
      //

      const inspect =
        await provider.inspect(previousDeployment.containerId);

      if (inspect.status !== "running") {
        throw new Error(
          "Rollback container failed to start."
        );
      }

      await deploymentLogService.append(
        deploymentId,
        "Previous deployment container is running."
      );

      //
      // Switch nginx
      //

      await deploymentLogService.append(
        deploymentId,
        "Switching nginx traffic..."
      );

      await proxyService.exposeDeployment(
        previousDeploymentId,
        `dep-${previousDeploymentId}`
      );

      await deploymentLogService.append(
        deploymentId,
        "Traffic switched successfully."
      );

      //
      // Remove failed deployment
      //

      if (failedDeployment.containerId) {
        try {
          await provider.stop(
            failedDeployment.containerId
          );
        } catch (error) {
          logger.warn(
            {
              error,
              containerId:
                failedDeployment.containerId,
            },
            "Unable to stop failed container"
          );
        }

        try {
          await provider.remove(
            failedDeployment.containerId
          );
        } catch (error) {
          logger.warn(
            {
              error,
              containerId:
                failedDeployment.containerId,
            },
            "Unable to remove failed container"
          );
        }
      }

      //
      // Restore previous deployment
      //

      await deploymentRepository.update(
        previousDeploymentId,
        {
          status: DeploymentStatus.SUCCESS,
          isHealthy: true,
        }
      );

      //
      // Mark failed deployment
      //

      await deploymentRepository.update(
        deploymentId,
        {
          status: DeploymentStatus.ROLLED_BACK,
          isHealthy: false,
          containerId: null,
          hostPort: null,
          containerUrl: null,
        }
      );

      await deploymentLogService.append(
        deploymentId,
        `Rollback completed successfully. Active deployment: ${previousDeploymentId}`
      );

      logger.info(
        {
          deploymentId,
          previousDeploymentId,
        },
        "Rollback completed"
      );

      return {
        success: true,
        rolledBackTo: previousDeploymentId,
      };
    } catch (error) {
      await deploymentRepository.update(
        deploymentId,
        {
          status: DeploymentStatus.FAILED,
        }
      );

      await deploymentLogService.append(
        deploymentId,
        `Rollback failed: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`
      );

      logger.error(
        {
          error,
          deploymentId,
          previousDeploymentId,
        },
        "Rollback failed"
      );

      throw error;
    }
  },
};