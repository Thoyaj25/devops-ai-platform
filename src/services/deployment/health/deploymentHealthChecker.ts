import { commandRunner } from "@/services/commandRunner/commandRunner";


export class DeploymentHealthChecker {


  async check(
    containerName:string
  ){

    const result =
      await commandRunner.run({

        command:"docker",

        args:[
          "exec",
          containerName,
          "wget",
          "-qO-",
          "http://127.0.0.1:3000/api/health"
        ],

        cwd:process.cwd()

      });



    if(result.exitCode !== 0){

      throw new Error(
        `Health check failed:
        ${result.stderr}`
      );

    }


    return true;

  }

}


export const deploymentHealthChecker =
 new DeploymentHealthChecker();