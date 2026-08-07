import { dockerClient } from "./dockerClient";

export const dockerImageService = {
  async build(
  workspace: string,
  image: string,
  jobId?: string,
  options?: {
    onStdout?: (
      line: string
    ) => void | Promise<void>;
    onStderr?: (
      line: string
    ) => void | Promise<void>;
  }
): Promise<void> {
    const buildArgs: string[] = ["build"];

    // Enable only for testing
    if (process.env.DOCKER_BUILD_NO_CACHE === "true") {
      buildArgs.push("--no-cache");
    }

    buildArgs.push(
      "-t",
      image,
      "."
    );

    const result = await dockerClient.run(
  "docker",
  buildArgs,
  {
    cwd: workspace,
    jobId,

    onStdout:
      options?.onStdout,

    onStderr:
      options?.onStderr,
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
    const result = await dockerClient.run(
      "docker",
      ["push", image]
    );

    if (result.exitCode !== 0) {
      throw new Error(
        `Docker push failed:\n${result.stderr}`
      );
    }
  },
};