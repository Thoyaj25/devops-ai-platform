import {
 deploymentJobService
}
from "@/services/deployment/deploymentJobService";

import {
 deploymentExecutor
}
from "@/services/deployment/deploymentExecutor";


export async function runDeploymentWorker(){

 const jobs =
  await deploymentJobService.getPendingJobs();


 for(const job of jobs){

  try{

   await deploymentJobService.updateJob(
    job.id,
    "RUNNING"
   );


   await deploymentExecutor.execute(job.deploymentId);


   await deploymentJobService.updateJob(
    job.id,
    "COMPLETED"
   );


  }catch(error){

   await deploymentJobService.updateJob(
    job.id,
    "FAILED",
    error instanceof Error
    ? error.message
    : "Unknown error"
   );

  }

 }

}