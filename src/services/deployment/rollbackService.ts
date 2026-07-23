import { DeploymentStatus } from "@/generated/prisma";
import { deploymentRepository } from "@/repositories/deploymentRepository";
import { DockerDeploymentProvider } from "@/services/providers";
import { proxyService } from "@/services/proxy/proxyService";

export const rollbackService = {
  async rollback(
    deploymentId: string,
    previousDeploymentId: string
  ) {
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

    if (!previousDeployment.containerId) {
      throw new Error(
        "Previous deployment container missing"
      );
    }

    //
    // Rollback starts
    //

    await deploymentRepository.update(deploymentId, {
      status: DeploymentStatus.ROLLING_BACK,
      isHealthy: false,
    });

    try {
      //
      // Ensure previous container is running
      //

      await provider.start(
        previousDeployment.containerId
      );

      //
      // Switch nginx traffic
      //

      await proxyService.exposeDeployment(
  deploymentId,
  `dep-${previousDeploymentId}`
);

      //
      // Remove failed container
      //

      if (failedDeployment.containerId) {
        try {
          await provider.stop(
            failedDeployment.containerId
          );
        } catch (error) {
          console.warn(
            `Unable to stop container ${failedDeployment.containerId}`,
            error
          );
        }

        try {
          await provider.remove(
            failedDeployment.containerId
          );
        } catch (error) {
          console.warn(
            `Unable to remove container ${failedDeployment.containerId}`,
            error
          );
        }
      }

      //
      // Previous deployment becomes active again
      //

      await deploymentRepository.update(
        previousDeploymentId,
        {
          status: DeploymentStatus.SUCCESS,
          isHealthy: true,
        }
      );

      //
      // Failed deployment is now rolled back
      //

      await deploymentRepository.update(deploymentId, {
        status: DeploymentStatus.ROLLED_BACK,
        isHealthy: false,
        containerId: null,
        hostPort: null,
        containerUrl: null,
      });

      return {
        success: true,
        rolledBackTo: previousDeploymentId,
      };
    } catch (error) {
      //
      // Rollback itself failed
      //

      await deploymentRepository.update(deploymentId, {
        status: DeploymentStatus.FAILED,
      });

      throw error;
    }
  },
};