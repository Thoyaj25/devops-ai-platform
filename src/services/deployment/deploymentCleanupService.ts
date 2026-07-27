import { DeploymentStatus } from "@/generated/prisma";

import { deploymentRepository } from "@/repositories/deploymentRepository";
import { DockerDeploymentProvider } from "@/services/providers";
import { deploymentLogService } from "./logs/deploymentLogService";
import { removeNginxConfig } from "@/services/proxy/nginx/nginxConfigRemover";


const provider =
  new DockerDeploymentProvider();


const RETAIN_SUCCESSFUL_DEPLOYMENTS = 2;


export const deploymentCleanupService = {


  async cleanupPreviousDeployment(
    deploymentId: string
  ): Promise<void> {


    try {


      const deployments =
        await deploymentRepository.findSuccessfulDeployments();


      const oldDeployments =
        deployments
          .filter(
            deployment =>
              deployment.id !== deploymentId
          )
          .slice(
            RETAIN_SUCCESSFUL_DEPLOYMENTS - 1
          );



      if (oldDeployments.length === 0) {

        console.info(
          "[Cleanup] No old deployments found."
        );

        return;
      }



      for (const deployment of oldDeployments) {


        try {


          console.info(
            "[Cleanup] Removing old deployment",
            {
              deploymentId: deployment.id,
              containerId:
                deployment.containerId
            }
          );



          if (deployment.containerId) {

            await provider.remove(
              deployment.containerId
            );


            console.info(
              "[Cleanup] Container removed",
              {
                containerId:
                  deployment.containerId
              }
            );

          }



          await removeNginxConfig(
            deployment.id
          );



          await deploymentRepository.update(
            deployment.id,
            {
              status:
                DeploymentStatus.SUPERSEDED,

              containerId: null,

              hostPort: null,

              containerUrl: null,

              isHealthy: false,
            }
          );



          await deploymentLogService.append(
            deployment.id,
            "Deployment cleaned after retention policy."
          );



          console.info(
            `[Cleanup] Deployment ${deployment.id} removed.`
          );


        }
        catch(error) {


          console.error(
            `[Cleanup] Failed cleaning deployment ${deployment.id}`,
            error
          );


          // Continue cleaning remaining deployments
        }

      }


    }
    catch(error) {


      console.error(
        "[Cleanup] Cleanup process failed",
        error
      );


      // Cleanup failure should never fail deployment

    }

  },


};