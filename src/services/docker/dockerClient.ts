import { commandRunner } 
from "@/services/commandRunner/commandRunner";


export const dockerClient = {


  async run(
    command: string,
    args: string[],
    options?: {
      cwd?: string;
    }
  ) {


    return commandRunner.run({

      command,

      args,

      cwd:
        options?.cwd ??
        process.cwd()

    });

  },



  async removeWorkspace(
    workspace: string
  ) {


    return this.run(
      "rm",
      [
        "-rf",
        workspace
      ]
    );

  },



  async gitClone(
    repository: string,
    workspace: string,
    branch: string
  ) {


    const result =
      await this.run(
        "git",
        [
          "clone",
          "--depth",
          "1",
          "--branch",
          branch,
          repository,
          workspace
        ]
      );


    if(result.exitCode !== 0) {

      throw new Error(
        `Git clone failed:\n${result.stderr}`
      );

    }


  }


};