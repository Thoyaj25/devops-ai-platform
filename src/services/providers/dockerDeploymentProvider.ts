import { commandRunner } from "@/services/commandRunner/commandRunner";
import { deploymentLogService } from "@/services/deployment/logs/deploymentLogService";
import {
  DeploymentProvider,
  DeployResult,
  ContainerInfo,
} from "./deploymentProvider";


const sleep = (ms:number)=>
  new Promise(resolve=>setTimeout(resolve,ms));


export class DockerDeploymentProvider implements DeploymentProvider {


  private registry =
    process.env.DOCKER_REGISTRY ?? "docker.io";


  private network =
    process.env.DOCKER_NETWORK ?? "marketsphere";


  async checkout(
    deploymentId:string,
    repository:string,
    workspace:string,
    branch="main"
  ):Promise<void>{


    await deploymentLogService.append(
      deploymentId,
      `Preparing workspace ${workspace}`
    );


    await commandRunner.run({
      command:"rm",
      args:["-rf",workspace],
      cwd:process.cwd()
    });


    const result =
      await commandRunner.run({

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


    if(result.exitCode!==0){

      throw new Error(
        `Git clone failed: ${result.stderr}`
      );

    }


    await deploymentLogService.append(
      deploymentId,
      "Repository cloned"
    );

  }


async build(
  deploymentId: string,
  workspace: string,
  command?: string
): Promise<void> {

  const image = process.env.DOCKER_IMAGE;

  if (!image) {
    throw new Error("DOCKER_IMAGE missing");
  }

  const tag = deploymentId;

  const fullImage =
    `${this.registry}/${image}:${tag}`;

  const buildCommand =
    command ??
    `docker build --progress=plain -t ${fullImage} .`;

  await deploymentLogService.append(
    deploymentId,
    `Building ${fullImage}`
  );

  const result =
    await commandRunner.run({
      command: "sh",
      args: [
        "-c",
        buildCommand
      ],
      cwd: workspace,
      onStdout: data =>
        deploymentLogService.append(
          deploymentId,
          data
        ),
      onStderr: data =>
        deploymentLogService.append(
          deploymentId,
          data
        )
    });

  if (result.exitCode !== 0) {

    console.error(result.stdout);

    console.error(result.stderr);

    throw new Error(
      [
        "",
        "Docker build failed.",
        "",
        "STDOUT:",
        result.stdout,
        "",
        "STDERR:",
        result.stderr
      ].join("\n")
    );

  }

}



  async push(
    deploymentId:string,
    image:string,
    tag:string
  ):Promise<void>{


    const fullImage =
      `${this.registry}/${image}:${tag}`;


    const result =
      await commandRunner.run({

        command:"docker",

        args:[
          "push",
          fullImage
        ],

        cwd:process.cwd()

      });


    if(result.exitCode!==0){

      throw new Error(
        `Docker push failed ${result.stderr}`
      );

    }


    await deploymentLogService.append(
      deploymentId,
      "Image pushed"
    );

  }




  async deploy(
    deploymentId:string,
    workspace:string,
    image:string,
    tag:string
  ):Promise<DeployResult>{



    const fullImage =
      `${this.registry}/${image}:${tag}`;



    const containerName =
      `dep-${deploymentId}`;



    await commandRunner.run({

      command:"docker",

      args:[
        "rm",
        "-f",
        containerName
      ],

      cwd:workspace

    });



    await commandRunner.run({

      command:"docker",

      args:[
        "pull",
        fullImage
      ],

      cwd:workspace

    });



    const result =
      await commandRunner.run({

        command:"docker",

        args:[

          "run",

          "-d",

          "--name",
          containerName,


          "--network",
          this.network,


          "--network-alias",
          containerName,


          "--restart",
          "unless-stopped",


          "-p",
          "0:3000",


          "--label",
          `marketsphere.deployment=${deploymentId}`,


          "-e",
          "HOSTNAME=0.0.0.0",


          fullImage

        ],

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
        `Container start failed ${result.stderr}`
      );

    }



    const containerId =
      result.stdout.trim();



    await this.waitUntilRunning(
      deploymentId,
      containerId
    );



    const port =
      await this.getMappedPort(
        containerId
      );



    return {

      containerId,

      containerName,

      hostPort:port,

      containerUrl:
        `http://${containerName}.marketsphere.local`

    };


  }




  private async waitUntilRunning(
    deploymentId:string,
    containerId:string
  ){


    for(
      let i=0;
      i<30;
      i++
    ){


      const info =
        await this.inspect(
          containerId
        );


      if(info.running){

        await deploymentLogService.append(
          deploymentId,
          "Container running"
        );

        return;

      }


      await sleep(1000);

    }


    throw new Error(
      "Container failed to start"
    );

  }





  private async getMappedPort(
    containerId:string
  ){

    const result =
      await commandRunner.run({

        command:"docker",

        args:[
          "port",
          containerId,
          "3000"
        ],

        cwd:process.cwd()

      });



    const match =
      result.stdout.match(
        /:(\d+)$/
      );


    if(!match)
      throw new Error(
        "Unable to detect port"
      );


    return Number(match[1]);

  }




  async stop(id:string){

    await this.docker([
      "stop",
      id
    ]);

  }


  async start(id:string){

    await this.docker([
      "start",
      id
    ]);

  }



  async restart(id:string){

    await this.docker([
      "restart",
      id
    ]);

  }



  async remove(id:string){

    await this.docker([
      "rm",
      "-f",
      id
    ]);

  }



  async removeContainer(name:string){

    await this.remove(name);

  }




  async inspect(id:string):Promise<ContainerInfo>{


    const result =
      await commandRunner.run({

        command:"docker",

        args:[
          "inspect",
          id
        ],

        cwd:process.cwd()

      });



    if(result.exitCode!==0)
      throw new Error(
        result.stderr
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

  }



  async containerExists(
    id:string
  ){

    const result =
      await commandRunner.run({

        command:"docker",

        args:[
          "inspect",
          id
        ],

        cwd:process.cwd()

      });


    return result.exitCode===0;

  }




  private async docker(
    args:string[]
  ){

    await commandRunner.run({

      command:"docker",

      args,

      cwd:process.cwd()

    });

  }

}