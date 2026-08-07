import { DeploymentStatus } from "@/generated/prisma";
import { logger } from "@/lib/logger";

import { deploymentRepository } from "@/repositories/deploymentRepository";

import { DockerDeploymentProvider } from "@/services/providers";
import { proxyService } from "@/services/proxy/proxyService";

import { deploymentLogService } from "./logs/deploymentLogService";
import { deploymentHealthChecker } from "@/services/deployment/health/deploymentHealthChecker";


export const rollbackService = {

  async rollback(
    deploymentId: string,
    previousDeploymentId: string
  ) {

    const provider =
      new DockerDeploymentProvider();


    const current =
      await deploymentRepository.findById(
        deploymentId
      );


    const previous =
      await deploymentRepository.findById(
        previousDeploymentId
      );


    if (!current) {
      throw new Error(
        "Current deployment not found"
      );
    }


    if (!previous) {
      throw new Error(
        "Previous deployment not found"
      );
    }


    if (
      current.projectId !== previous.projectId
    ) {
      throw new Error(
        "Deployments belong to different projects"
      );
    }


    if (!previous.containerId) {
      throw new Error(
        "Previous deployment has no container"
      );
    }



    await deploymentRepository.update(
      deploymentId,
      {
        status: DeploymentStatus.ROLLING_BACK,
        isHealthy: false,
      }
    );


    await deploymentLogService.append(
      deploymentId,
      `Rollback started -> ${previousDeploymentId}`
    );


    try {


      const exists =
        await provider.exists(
          previous.containerId
        );


      if (!exists) {
        throw new Error(
          "Previous container does not exist"
        );
      }



      await provider.start(
        previous.containerId
      );



      const inspect =
        await provider.inspect(
          previous.containerId
        );


      if (
        inspect.status !== "running"
      ) {
        throw new Error(
          "Previous container is not running"
        );
      }
      
      await deploymentHealthChecker.check(
  `dep-${previousDeploymentId}`,
  {
    path: previous.project.healthCheckPath,
    port: previous.project.healthCheckPort,
    startupTimeout: previous.project.startupTimeout,
  },
  undefined
);



      await proxyService.exposeDeployment(
        previousDeploymentId,
        `dep-${previousDeploymentId}`
      );



      await proxyService.removeDeployment(
        deploymentId
      );



      await deploymentRepository.update(
        previousDeploymentId,
        {
          status: DeploymentStatus.SUCCESS,
          isHealthy: true,
        }
      );



      const rolledBackDeployment =
        await deploymentRepository.update(
          deploymentId,
          {
            status: DeploymentStatus.ROLLED_BACK,
            isHealthy: false,
          }
        );



      await deploymentLogService.append(
        deploymentId,
        `Rollback completed. Active deployment ${previousDeploymentId}`
      );



      if (current.containerId) {

  await this.cleanupContainer(
    provider,
    current.containerId
  );

  await deploymentRepository.clearContainer(
    deploymentId
  );

}



      return {
        success: true,

        // frontend redirect target
        id: previousDeploymentId,

        previousDeploymentId,

        rolledBackDeployment,

      };


    } catch(error) {


      await deploymentRepository.update(
        deploymentId,
        {
          status: DeploymentStatus.FAILED,
          isHealthy: false,
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



 async cleanupContainer(
  provider: DockerDeploymentProvider,
  containerId: string
) {
  try {
    await provider.remove(containerId);
  } catch (error) {
    logger.warn(
      {
        error,
        containerId,
      },
      "Container remove failed"
    );
  }
}

};