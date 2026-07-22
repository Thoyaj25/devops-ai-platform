import { DeploymentStatus } from "@/generated/prisma";
import { deploymentRepository } from "@/repositories/deploymentRepository";
import { DockerDeploymentProvider } from "@/services/providers";
import { proxyService } from "@/services/proxy/proxyService";

const dockerProvider = new DockerDeploymentProvider();

export const deploymentCleanupService = {
  async cleanupPreviousDeployment(
    deployment: {
      id: string;
      containerId: string | null;
    } | null
  ): Promise<void> {

    if (!deployment) {
      console.warn(
        "[Cleanup] No deployment provided"
      );
      return;
    }


    console.log(
      "[Cleanup] Starting cleanup:",
      {
        deploymentId: deployment.id,
        containerId: deployment.containerId,
      }
    );


    let cleanupFailed = false;


    /*
     * 1. Remove nginx configuration
     */
    try {

      await proxyService.removeDeployment(
        deployment.id
      );

      console.log(
        `[Cleanup] Removed nginx configuration: ${deployment.id}`
      );


    } catch (error: any) {

      if (error?.code === "ENOENT") {

        console.log(
          `[Cleanup] Nginx config already removed: ${deployment.id}`
        );

      } else {

        cleanupFailed = true;

        console.error(
          `[Cleanup] Nginx cleanup failed: ${deployment.id}`,
          error
        );
      }
    }



    /*
     * 2. Remove docker container
     */
    if (deployment.containerId) {

      try {

        await dockerProvider.removeContainer(
          deployment.containerId
        );


        console.log(
          `[Cleanup] Removed container: ${deployment.containerId}`
        );


      } catch (error) {

        cleanupFailed = true;

        console.error(
          `[Cleanup] Docker container cleanup failed: ${deployment.containerId}`,
          error
        );

      }

    } else {

      console.log(
        `[Cleanup] No container attached: ${deployment.id}`
      );

    }



    /*
     * 3. Update deployment lifecycle state
     */
    try {

      await deploymentRepository.update(
        deployment.id,
        {
          status: cleanupFailed
            ? DeploymentStatus.FAILED
            : DeploymentStatus.SUPERSEDED,

          containerId: null,
          containerUrl: null,
          hostPort: null,
          isHealthy: false,
        }
      );


      console.log(
        cleanupFailed
          ? `[Cleanup] Marked failed cleanup: ${deployment.id}`
          : `[Cleanup] Marked superseded: ${deployment.id}`
      );


    } catch (error) {

      console.error(
        `[Cleanup] Failed updating deployment record: ${deployment.id}`,
        error
      );

      throw error;
    }



    console.log(
      `[Cleanup] Completed cleanup: ${deployment.id}`
    );
  },
};