import {
 deploymentJobRepository
}
from "@/repositories/deploymentJobRepository";


export const deploymentJobService={


 async createJob(deploymentId:string){

   return deploymentJobRepository.create(
     deploymentId
   );

 },


 async getPendingJobs(){

   return deploymentJobRepository.findPending();

 },


 async updateJob(
  id:string,
  status:
   |"RUNNING"
   |"COMPLETED"
   |"FAILED",
  error?:string
 ){

   return deploymentJobRepository.update(
     id,
     {
       status,
       error
     }
   );

 }

};