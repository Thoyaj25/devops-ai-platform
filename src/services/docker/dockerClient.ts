import { commandRunner } 
from "@/services/commandRunner/commandRunner";


export const dockerClient = {


  async run(
  command: string,
  args: string[],
  options?: {
    cwd?: string;
    jobId?: string;
    onStdout?: (
      line: string
    ) => void | Promise<void>;
    onStderr?: (
      line: string
    ) => void | Promise<void>;
  }
) {


    return commandRunner.run({

  command,

  args,

  cwd:
    options?.cwd ??
    process.cwd(),

  jobId:
    options?.jobId,

  onStdout:
    options?.onStdout,

  onStderr:
    options?.onStderr,

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
  branch: string,
  options?: {
    onStdout?: (
      line: string
    ) => void | Promise<void>;
    onStderr?: (
      line: string
    ) => void | Promise<void>;
  }
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
    ],
    {
      onStdout:
        options?.onStdout,

      onStderr:
        options?.onStderr,
    }
  );


    if(result.exitCode !== 0) {

      throw new Error(
        `Git clone failed:\n${result.stderr}`
      );

    }


  }


};