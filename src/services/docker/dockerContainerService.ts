import { dockerClient } 
from "./dockerClient";


export const dockerContainerService = {


 async run(options:{
  name:string;
  image:string;
  network:string;
 }){


 const result =
 await dockerClient.run(
 "docker",
 [
  "run",
  "-d",

  "--name",
  options.name,

  "--network",
  options.network,

  "--network-alias",
  options.name,

  "--restart",
  "unless-stopped",

  "-e",
  "HOSTNAME=0.0.0.0",

  options.image
 ]
 );


 if(result.exitCode!==0)
  throw new Error(result.stderr);



 return result.stdout.trim();

 },



 async remove(name:string){

 await dockerClient.run(
 "docker",
 [
  "rm",
  "-f",
  name
 ]
 );

 },



 async stop(id:string){

 return dockerClient.run(
 "docker",
 [
  "stop",
  id
 ]
 );

 },



 async start(id:string){

 return dockerClient.run(
 "docker",
 [
  "start",
  id
 ]
 );

 },



 async restart(id:string){

 return dockerClient.run(
 "docker",
 [
  "restart",
  id
 ]
 );

 },



 async inspect(id:string){

 const result =
 await dockerClient.run(
 "docker",
 [
  "inspect",
  id
 ]
 );


 const data =
 JSON.parse(result.stdout)[0];


 return {

 id:data.Id,

 name:data.Name.replace("/",""),

 image:data.Config.Image,

 status:data.State.Status,

 running:data.State.Running

 };


 },



 async exists(id:string){

 const result =
 await dockerClient.run(
 "docker",
 [
  "inspect",
  id
 ]
 );


 return result.exitCode===0;

 },



 async waitRunning(id:string){

 for(let i=0;i<30;i++){

  const info =
  await this.inspect(id);


  if(info.running)
    return;


  await new Promise(
   r=>setTimeout(r,1000)
  );

 }


 throw new Error(
  "Container failed"
 );

 }


};