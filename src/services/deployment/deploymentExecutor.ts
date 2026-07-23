import { config } from "@/lib/config";
import { DeploymentStatus } from "@/generated/prisma";

import { deploymentRepository } from "@/repositories/deploymentRepository";

import {
  DockerDeploymentProvider,
} from "@/services/providers";

import { workspaceService } from "./workspace/workspaceService";
import { stageRunner } from "./stageRunner";
import { DeploymentStage } from "./stages";

import { deploymentLogService } from "./logs/deploymentLogService";

import { withTimeout } from "@/lib/utils/timeout";

import { proxyService } from "@/services/proxy/proxyService";

import { deploymentCleanupService } from "./deploymentCleanupService";



export const deploymentExecutor = {


  async execute(
    deploymentId:string
  ) {


    const deployment =
      await deploymentRepository.findById(
        deploymentId
      );


    if(!deployment){

      throw new Error(
        "Deployment not found"
      );

    }



    const provider =
      new DockerDeploymentProvider();



    const workspace =
      await workspaceService.prepare(
        deploymentId
      );



    let containerId:
      string | undefined;



    try {



      const previousDeployment =
        await deploymentRepository
          .findPreviousSuccessfulDeployment(
            deployment.projectId,
            deploymentId
          );



      const {
        repository,
        branch,
        buildCommand,
        deployCommand,

      } =
        deployment.pipeline;



      if(!repository){

        throw new Error(
          "Deployment repository missing"
        );

      }




      await stageRunner.run(
        deploymentId,
        DeploymentStage.CLONING,

        async()=>{


          await withTimeout(

            provider.checkout(
              deploymentId,
              repository,
              workspace,
              branch ?? "main"
            ),

            300000,

            "Checkout timeout"

          );


        }

      );





      await stageRunner.run(

        deploymentId,

        DeploymentStage.BUILDING,


        async()=>{


          await withTimeout(

            provider.build(
              deploymentId,
              workspace,
              buildCommand ?? undefined
            ),


            600000,


            "Build timeout"

          );


        }

      );





      const image =
        process.env.DOCKER_IMAGE;



      if(!image){

        throw new Error(
          "DOCKER_IMAGE missing"
        );

      }





      const runtime =

        await stageRunner.run(

          deploymentId,

          DeploymentStage.DEPLOYING,


          async()=>{


            const result =

              await withTimeout(

                provider.deploy(

                  deploymentId,

                  workspace,

                  image,

                  deploymentId,

                  deployCommand ?? undefined

                ),

                300000,

                "Deploy timeout"

              );



            containerId =
              result.containerId;



            await deploymentRepository.update(

              deploymentId,

              {

                containerId:
                  result.containerId,


                hostPort:
                  result.hostPort,


                containerUrl:
                  result.containerUrl,

              }

            );



            return result;


          }

        );







      await stageRunner.run(

        deploymentId,

        DeploymentStage.VERIFYING,


        async()=>{


          await deploymentLogService.append(

            deploymentId,

            "Container health verification started"

          );



          await proxyService.exposeDeployment(

            deploymentId,

            runtime.containerName

          );




          await deploymentRepository.update(

            deploymentId,

            {

              status:
                DeploymentStatus.SUCCESS,


              isHealthy:
                true,

            }

          );




          await deploymentLogService.append(

            deploymentId,

            `Deployment available at http://${deploymentId}.${config.deploymentDomain}`

          );




          if(previousDeployment){

            await deploymentCleanupService
              .cleanupPreviousDeployment(
                previousDeployment
              );

          }


        }

      );



    }

    catch(error){



      const message =
        error instanceof Error
          ? error.message
          : String(error);



      await deploymentLogService.append(

        deploymentId,

        `Deployment failed: ${message}`

      );




      if(containerId){

        try{

          await proxyService.removeDeployment(
            deploymentId
          );

        }
        catch{}

      }





      await deploymentRepository.update(

        deploymentId,

        {

          status:
            DeploymentStatus.FAILED,


          isHealthy:
            false,

        }

      );



      throw error;


    }



    finally{


      await workspaceService.cleanup(
        deploymentId
      );


    }


  },

};