import { DeploymentStatus } from "@/generated/prisma";

import { logger } from "@/lib/logger";
import { deploymentRepository } from "@/repositories/deploymentRepository";

import { DockerDeploymentProvider } from "@/services/providers";
import { proxyService } from "@/services/proxy/proxyService";

import { deploymentLogService } from "./logs/deploymentLogService";


export const rollbackService = {

  async rollback(
    deploymentId: string,
    previousDeploymentId: string
  ) {

    const provider = new DockerDeploymentProvider();


    //
    // Load deployments
    //

    const currentDeployment =
      await deploymentRepository.findById(deploymentId);


    if (!currentDeployment) {
      throw new Error("Current deployment not found");
    }


    const previousDeployment =
      await deploymentRepository.findById(previousDeploymentId);


    if (!previousDeployment) {
      throw new Error("Previous deployment not found");
    }


    //
    // Validate same project
    //

    if (
      currentDeployment.projectId !==
      previousDeployment.projectId
    ) {
      throw new Error(
        "Deployments belong to different projects"
      );
    }


    //
    // Validate rollback source
    //

    const rollbackAllowedStatuses: DeploymentStatus[] = [
      DeploymentStatus.SUCCESS,
      DeploymentStatus.FAILED,
      DeploymentStatus.DEPLOYING,
      DeploymentStatus.HEALTH_CHECKING,
    ];


    if (
      !rollbackAllowedStatuses.includes(
        currentDeployment.status
      )
    ) {
      throw new Error(
        `Deployment ${deploymentId} cannot be rolled back from ${currentDeployment.status}`
      );
    }


    //
    // Validate rollback target
    //

    if (!previousDeployment.containerId) {
      throw new Error(
        "Previous deployment has no container"
      );
    }


    if (
      previousDeployment.status !== DeploymentStatus.SUCCESS &&
      previousDeployment.status !== DeploymentStatus.SUPERSEDED
    ) {
      throw new Error(
        `Previous deployment status ${previousDeployment.status} is not usable`
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
      `Rollback started. Restoring ${previousDeploymentId}`
    );



    try {


      //
      // Verify previous container
      //

      const exists =
        await provider.exists(
          previousDeployment.containerId
        );


      if (!exists) {
        throw new Error(
          "Previous deployment container does not exist"
        );
      }



      //
      // Start previous container
      //

      await deploymentLogService.append(
        deploymentId,
        "Starting previous container"
      );


      await provider.start(
        previousDeployment.containerId
      );



      //
      // Verify container
      //

      const inspect =
        await provider.inspect(
          previousDeployment.containerId
        );


      if (
        inspect.status !== "running"
      ) {
        throw new Error(
          "Previous container is not running"
        );
      }



      //
      // Switch nginx traffic
      //

      await deploymentLogService.append(
        deploymentId,
        "Switching nginx traffic"
      );


      await proxyService.exposeDeployment(
        previousDeploymentId,
        `dep-${previousDeploymentId}`
      );


      await proxyService.verifyDeployment(
        previousDeploymentId
      );



      //
      // Remove failed deployment route
      //

      await proxyService.removeDeployment(
        deploymentId
      );



      //
      // Update deployment states
      //

      await deploymentRepository.update(
        previousDeploymentId,
        {
          status: DeploymentStatus.SUCCESS,
          isHealthy: true,
        }
      );


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



      //
      // Cleanup old container
      //

      if (
        currentDeployment.containerId
      ) {

        await this.cleanupContainer(
          provider,
          currentDeployment.containerId
        );

      }



      logger.info(
        {
          deploymentId,
          previousDeploymentId,
        },
        "Rollback completed"
      );


      return {
        success:true,
        rolledBackTo: previousDeploymentId,
      };


    } catch(error) {


      await deploymentRepository.update(
        deploymentId,
        {
          status: DeploymentStatus.FAILED,
          isHealthy:false,
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
    containerId:string
  ) {


    try {

      await provider.stop(
        containerId
      );


      await provider.remove(
        containerId
      );


      logger.info(
        {
          containerId,
        },
        "Old container removed"
      );


    } catch(error) {


      logger.warn(
        {
          error,
          containerId,
        },
        "Container cleanup failed"
      );

    }

  },


};