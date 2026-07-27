import fs from "fs/promises";
import path from "path";

import { logger } from "@/lib/logger";
import { deploymentRepository } from "@/repositories/deploymentRepository";
import { DockerDeploymentProvider } from "@/services/providers";
import { removeNginxConfig } from "@/services/proxy/nginx/nginxConfigRemover";


const NGINX_DIR = path.resolve(
  process.cwd(),
  "nginx/conf.d"
);


const dockerProvider =
  new DockerDeploymentProvider();



export const reconciliationService = {

  async reconcile(): Promise<void> {

    logger.info(
      "Starting deployment reconciliation..."
    );


    try {

      const files =
        await fs.readdir(
          NGINX_DIR
        );


      for (const file of files) {


        if (!file.endsWith(".conf")) {
          continue;
        }


        const deploymentId =
          file.replace(".conf", "");



        const deployment =
          await deploymentRepository.findById(
            deploymentId
          );


        if (!deployment) {


          logger.warn(
            {
              deploymentId
            },
            "Deployment missing, removing nginx config"
          );


          await removeNginxConfig(
            deploymentId
          );


          continue;
        }



        if (!deployment.containerId) {


          logger.warn(
            {
              deploymentId
            },
            "Deployment has no container, removing nginx config"
          );


          await removeNginxConfig(
            deploymentId
          );


          continue;
        }



        try {


          await dockerProvider.inspect(
            deployment.containerId
          );


          logger.info(
            {
              deploymentId,
              containerId:
                deployment.containerId
            },
            "Deployment container verified"
          );


        }
        catch {


          logger.warn(
            {
              deploymentId,
              containerId:
                deployment.containerId
            },
            "Container missing, removing nginx config"
          );


          await removeNginxConfig(
            deploymentId
          );

        }


      }


      logger.info(
        "Deployment reconciliation completed"
      );


    }
    catch(error){


      logger.error(
        {
          error
        },
        "Deployment reconciliation failed"
      );


      throw error;

    }

  }

};