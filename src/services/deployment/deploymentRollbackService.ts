import { logger } from "@/lib/logger";

import { deploymentRepository } from "@/repositories/deploymentRepository";

import { DockerDeploymentProvider } from "@/services/providers";
import { proxyService } from "@/services/proxy/proxyService";

const provider = new DockerDeploymentProvider();

export const deploymentRollbackService = {
  async rollback(
    deploymentId: string,
    containerId?: string
  ): Promise<void> {
    logger.warn(
      {
        deploymentId,
        containerId,
      },
      "Starting deployment rollback"
    );

    //
    // Remove nginx route
    //
    try {
      await proxyService.removeDeployment(deploymentId);
    } catch (error) {
      logger.warn({
        deploymentId,
        error,
      });
    }

    //
    // Remove container
    //
    if (containerId) {
      try {
        await provider.remove(containerId);
      } catch (error) {
        logger.warn({
          deploymentId,
          containerId,
          error,
        });
      }
    }

    //
    // Clear runtime metadata
    //
    await deploymentRepository.update(deploymentId, {
      containerId: null,
      containerUrl: null,
      hostPort: null,
      isHealthy: false,
    });

    logger.info(
      { deploymentId },
      "Deployment rollback completed"
    );
  },
};