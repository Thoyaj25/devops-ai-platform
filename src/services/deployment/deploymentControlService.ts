import { deploymentRepository } from "@/repositories/deploymentRepository";
import { DockerDeploymentProvider } from "@/services/providers";
import { proxyService } from "@/services/proxy/proxyService";


const provider =
  new DockerDeploymentProvider();



type DeploymentContainerContext = {
  id: string;
  containerId: string | null;
};



async function getDeployment(
  deploymentId:string
):Promise<DeploymentContainerContext>{


  const deployment =
    await deploymentRepository.findById(
      deploymentId
    );


  if(!deployment){

    throw new Error(
      `Deployment '${deploymentId}' not found`
    );

  }


  return {

    id:deployment.id,

    containerId:
      deployment.containerId,

  };


}




function requireContainer(
  deploymentId:string,
  containerId:string|null
):string{


  if(!containerId){

    throw new Error(
      `Deployment '${deploymentId}' has no active container. Deploy again or rollback to an active deployment.`
    );

  }


  return containerId;

}





export const deploymentControlService = {



async start(
  deploymentId:string
){


  const deployment =
    await getDeployment(
      deploymentId
    );


  const containerId =
    requireContainer(
      deploymentId,
      deployment.containerId
    );



  await provider.start(
    containerId
  );



  return {

    success:true,

    message:
      "Container started successfully",

  };


},







async stop(
 deploymentId:string
){


 const deployment =
   await getDeployment(
     deploymentId
   );



 if(!deployment.containerId){

   return {

     success:true,

     message:
       "Deployment already inactive",

   };

 }



 await provider.stop(
   deployment.containerId
 );



 return {

   success:true,

   message:
     "Container stopped successfully",

 };


},







async restart(
 deploymentId:string
){


 const deployment =
   await getDeployment(
     deploymentId
   );


 const containerId =
   requireContainer(
     deploymentId,
     deployment.containerId
   );



 await provider.restart(
   containerId
 );



 return {

   success:true,

   message:
     "Container restarted successfully",

 };


},








async remove(
 deploymentId:string
){


 const deployment =
   await getDeployment(
     deploymentId
   );



 // Always remove nginx route

 await proxyService.removeDeployment(
   deploymentId
 );




 // Remove docker container if exists

 if(deployment.containerId){

   await provider.remove(
     deployment.containerId
   );

 }




 await deploymentRepository.update(
   deploymentId,
   {

     containerId:null,

     hostPort:null,

     containerUrl:null,

     isHealthy:false,

   }
 );



 return {

   success:true,

   message:
     "Deployment removed successfully",

 };


},







async inspect(
 deploymentId:string
){


 const deployment =
   await getDeployment(
     deploymentId
   );



 if(!deployment.containerId){

   return {

     status:
       "inactive",

     container:
       null,

     message:
       "No active container attached to this deployment",

   };

 }



 return provider.inspect(
   deployment.containerId
 );


},


};