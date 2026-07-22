import { DockerDeploymentProvider } from "@/services/providers";
import { proxyService } from "@/services/proxy/proxyService";


export const rollbackService = {

 async rollback(
   deploymentId:string,
   previousContainerId:string
 ){

   const provider =
     new DockerDeploymentProvider();


   await provider.start(
     previousContainerId
   );


   await proxyService.exposeDeployment(
     deploymentId,
     previousContainerId,
     3000
   );


 }

};