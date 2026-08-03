import { dockerClient } from "./dockerClient";

export const dockerImageService = {

  async build(
  workspace: string,
  image: string,
  jobId?: string
): Promise<void> {

    const result =
  await dockerClient.run(
    "docker",
    [
      "build",
      "-t",
      image,
      "."
    ],
    {
      cwd: workspace,
      jobId,
    }
  );


    if (result.exitCode !== 0) {

      throw new Error(
        `Docker build failed:\n${result.stderr}`
      );

    }

  },



  async push(
    image: string
  ): Promise<void> {


    const result =
      await dockerClient.run(
        "docker",
        [
          "push",
          image
        ]
      );


    if (result.exitCode !== 0) {

      throw new Error(
        `Docker push failed:\n${result.stderr}`
      );

    }

  }

};