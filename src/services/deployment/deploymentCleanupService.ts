import { DeploymentStatus } from "@/generated/prisma";

import { deploymentRepository } from "@/repositories/deploymentRepository";
import { DockerDeploymentProvider } from "@/services/providers";
import { deploymentLogService } from "./logs/deploymentLogService";
import { removeNginxConfig } from "@/services/proxy/nginx/nginxConfigRemover";


const provider = new DockerDeploymentProvider();


const RETAIN_SUCCESSFUL_DEPLOYMENTS = 2;


export const deploymentCleanupService = {

  async cleanupPreviousDeployment(
    deploymentId: string
  ): Promise<void> {

    try {

      const currentDeployment =
  await deploymentRepository.findById(
    deploymentId
  );

if (!currentDeployment) {
  console.warn(
    "[Cleanup] Deployment not found",
    { deploymentId }
  );
  return;
}

const deployments =
  await deploymentRepository.findSuccessfulDeployments(
    currentDeployment.projectId
  );


      //
// Keep:
//
// 1. Current deployment
// 2. Newest previous deployment (rollback target)
//
// Everything older gets cleaned.
//
const oldDeployments = deployments.filter(
  (deployment, index) =>
    deployment.id !== deploymentId &&
    index >= (RETAIN_SUCCESSFUL_DEPLOYMENTS - 1)
);



      if (oldDeployments.length === 0) {

        console.info(
          "[Cleanup] No old deployments found."
        );

        return;
      }



      for (const deployment of oldDeployments) {

        console.info(
          "[Cleanup] Starting cleanup",
          {
            deploymentId: deployment.id,
            containerId: deployment.containerId
          }
        );


        try {


          //
// Protect rollback target
//
const isRollbackTarget =
  deployment.id === deployments[1]?.id;


if (!isRollbackTarget) {

  await deploymentRepository.update(
    deployment.id,
    {
      status: DeploymentStatus.SUPERSEDED,
      isHealthy: false,
    }
  );

}


          //
          // 2. Remove nginx routing
          //
          try {

            await removeNginxConfig(
              deployment.id
            );


            console.info(
              "[Cleanup] Nginx config removed",
              {
                deploymentId: deployment.id
              }
            );


          } catch(error) {

            console.error(
              "[Cleanup] Failed removing nginx config",
              {
                deploymentId: deployment.id,
                error
              }
            );

          }

// 3. Remove container
//
// Skip the newest previous deployment.
// We keep it as the rollback target.
//
if (
  deployment.containerId &&
  deployment.id !== deployments[1]?.id
) {
  try {

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

  } catch (error) {

    console.error(
      "[Cleanup] Container removal failed",
      {
        containerId:
          deployment.containerId,
        error
      }
    );

  }
}



          //
          // 4. Clear runtime metadata
          //
          if (deployment.id !== deployments[1]?.id) {
  await deploymentRepository.update(
    deployment.id,
    {
      containerId: null,
      hostPort: null,
      containerUrl: null,
    }
  );
}



          await deploymentLogService.append(
            deployment.id,
            "Deployment cleaned after retention policy."
          );


          console.info(
            "[Cleanup] Completed",
            {
              deploymentId: deployment.id
            }
          );


        } catch(error) {


          console.error(
            "[Cleanup] Failed cleaning deployment",
            {
              deploymentId: deployment.id,
              error
            }
          );


          //
          // Continue next deployment
          //
          continue;

        }

      }


    } catch(error) {


      console.error(
        "[Cleanup] Cleanup process failed",
        error
      );


      //
      // Cleanup should never fail deployment
      //
    }

  },

};