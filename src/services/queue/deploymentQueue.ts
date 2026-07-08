export const deploymentQueue = {

 async add(job:{
   deploymentId:string
 }){

   console.log(
    "Deployment queued",
    job
   );

 }

}