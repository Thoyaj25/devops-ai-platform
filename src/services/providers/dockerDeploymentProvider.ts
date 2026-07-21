import { commandRunner } from "@/services/commandRunner/commandRunner";
import { deploymentLogService } from "@/services/deployment/logs/deploymentLogService";
import {
  DeploymentProvider,
  DeployResult,
  ContainerInfo,
} from "./deploymentProvider";

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));


export class DockerDeploymentProvider implements DeploymentProvider {


  async checkout(
    deploymentId: string,
    repository: string,
    workspace: string,
    branch: string = "main"
  ): Promise<void> {

    await deploymentLogService.append(
      deploymentId,
      `Cloning repository ${repository} (${branch})`
    );


    const result = await commandRunner.run({
      command:"git",
      args:[
        "clone",
        "--depth",
        "1",
        "--branch",
        branch,
        repository,
        workspace
      ],
      cwd:process.cwd()
    });


    if(result.exitCode !== 0){
      throw new Error(
        `Git clone failed: ${result.stderr}`
      );
    }


    await deploymentLogService.append(
      deploymentId,
      "Repository cloned successfully"
    );
  }



  async build(
    deploymentId:string,
    workspace:string,
    command?:string
  ):Promise<void>{


    const image = process.env.DOCKER_IMAGE;

    if(!image){
      throw new Error(
        "DOCKER_IMAGE is not configured"
      );
    }


    const registry =
      process.env.DOCKER_REGISTRY ?? "docker.io";


    const fullImage =
      `${registry}/${image}:${deploymentId}`;


    const buildCommand =
      command ??
      `docker build -t ${fullImage} .`;



    await deploymentLogService.append(
      deploymentId,
      `Building image ${fullImage}`
    );



    const result =
      await commandRunner.run({

        command:"sh",

        args:[
          "-c",
          buildCommand
        ],

        cwd:workspace,

        onStdout:(data)=>
          deploymentLogService.append(
            deploymentId,
            data
          ),

        onStderr:(data)=>
          deploymentLogService.append(
            deploymentId,
            data
          )
      });



    if(result.exitCode !==0){

      throw new Error(
        `Build failed: ${result.stderr}`
      );

    }


    await deploymentLogService.append(
      deploymentId,
      "Build completed successfully"
    );

  }





  async push(
    deploymentId:string,
    image:string,
    tag:string
  ):Promise<void>{


    const registry =
      process.env.DOCKER_REGISTRY ?? "docker.io";


    const fullImage =
      `${registry}/${image}:${tag}`;


    const username =
      process.env.DOCKER_USER;


    const password =
      process.env.DOCKER_PASSWORD;



    if(!username || !password){

      throw new Error(
        "Docker credentials missing"
      );

    }



    await commandRunner.run({

      command:"sh",

      args:[
        "-c",
        `echo ${password} | docker login ${registry} -u ${username} --password-stdin`
      ],

      cwd:process.cwd()

    });



    const result =
      await commandRunner.run({

        command:"docker",

        args:[
          "push",
          fullImage
        ],

        cwd:process.cwd()

      });



    if(result.exitCode !==0){

      throw new Error(
        `Push failed:${result.stderr}`
      );

    }


  }





  private async waitForContainerReady(
    deploymentId:string,
    containerName:string,
    retries:number = 30
  ):Promise<void>{


    await deploymentLogService.append(
      deploymentId,
      `Waiting for ${containerName} health check`
    );



    for(let i=1;i<=retries;i++){


      const result =
        await commandRunner.run({

          command:"docker",

          args:[
            "exec",
            containerName,
            "node",
            "-e",
            `
            fetch("http://127.0.0.1:3000/api/health")
            .then(r=>{
              if(!r.ok) process.exit(1);
              process.exit(0);
            })
            .catch(()=>{
              process.exit(1);
            })
            `
          ],

          cwd:process.cwd()

        });



      if(result.exitCode===0){

        await deploymentLogService.append(
          deploymentId,
          `Container ${containerName} is healthy`
        );

        return;

      }



      await deploymentLogService.append(
        deploymentId,
        `Health check attempt ${i}/${retries} failed`
      );


      await sleep(1000);

    }



    throw new Error(
      `Container ${containerName} failed health check`
    );

  }






  async deploy(
    deploymentId:string,
    workspace:string,
    image:string,
    tag:string,
    command?:string
  ):Promise<DeployResult>{



    const registry =
      process.env.DOCKER_REGISTRY ?? "docker.io";


    const fullImage =
      `${registry}/${image}:${tag}`;


    const containerName =
      `dep-${deploymentId}`;



    const network =
      process.env.DOCKER_NETWORK ??
      "marketsphere";



    await commandRunner.run({

      command:"docker",

      args:[
        "rm",
        "-f",
        containerName
      ],

      cwd:workspace

    });





    const envVars=[

      "DATABASE_URL",
      "REDIS_URL",
      "NEXTAUTH_SECRET",
      "NEXTAUTH_URL",
      "ADMIN_USER",
      "ADMIN_PASS",
      "NODE_ENV"

    ];



    const envArgs =
      envVars
      .filter(k=>process.env[k])
      .flatMap(k=>[
        "-e",
        `${k}=${process.env[k]}`
      ]);





    const dockerArgs=[

      "run",
      "-d",

      "--name",
      containerName,

      "--hostname",
      containerName,

      "--network",
      network,

      "--network-alias",
      containerName,

      "--restart",
      "unless-stopped",

      "-p",
      "0:3000",

      "-e",
      "HOSTNAME=0.0.0.0",

      ...envArgs,

      fullImage

    ];





    const result =
      await commandRunner.run({

        command:"docker",

        args:dockerArgs,

        cwd:workspace,

        onStdout:data=>
          deploymentLogService.append(
            deploymentId,
            data
          ),

        onStderr:data=>
          deploymentLogService.append(
            deploymentId,
            data
          )

      });





    if(result.exitCode!==0){

      throw new Error(
        `Deploy failed:${result.stderr}`
      );

    }




    const containerId =
      result.stdout.trim();




    await this.waitForContainerReady(
      deploymentId,
      containerName
    );





    const portResult =
      await commandRunner.run({

        command:"docker",

        args:[
          "port",
          containerName,
          "3000"
        ],

        cwd:workspace

      });



    const hostPort =
      Number(
        portResult.stdout
        .trim()
        .split(":")
        .pop()
      );




    return {

      containerId,

      containerName,

      hostPort,

      containerUrl:
        `http://${containerName}:3000`

    };

  }






  async stop(containerId:string){
    await commandRunner.run({
      command:"docker",
      args:["stop",containerId],
      cwd:process.cwd()
    });
  }



  async start(containerId:string){
    await commandRunner.run({
      command:"docker",
      args:["start",containerId],
      cwd:process.cwd()
    });
  }



  async restart(containerId:string){
    await commandRunner.run({
      command:"docker",
      args:["restart",containerId],
      cwd:process.cwd()
    });
  }



  async remove(containerId:string){
    await commandRunner.run({
      command:"docker",
      args:[
        "rm",
        "-f",
        containerId
      ],
      cwd:process.cwd()
    });
  }





  async inspect(
    containerId:string
  ):Promise<ContainerInfo>{


    const result =
      await commandRunner.run({

        command:"docker",

        args:[
          "inspect",
          containerId
        ],

        cwd:process.cwd()

      });



    if(result.exitCode!==0){

      throw new Error(
        result.stderr
      );

    }



    const data =
      JSON.parse(result.stdout)[0];



    return {

      id:data.Id,

      name:data.Name.replace("/",""),

      image:data.Config.Image,

      status:data.State.Status,

      running:data.State.Running

    };

  }


}