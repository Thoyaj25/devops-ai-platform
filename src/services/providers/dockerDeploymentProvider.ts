import { logger } from "@/lib/logger";
import { DeploymentProvider } from "./deploymentProvider";
import { commandRunner } from "@/services/commandRunner/commandRunner";

export class DockerDeploymentProvider implements DeploymentProvider {
  async checkout(
    repository: string,
    branch: string,
    workspace: string
  ): Promise<void> {
    logger.info(
      {
        repository,
        branch,
        workspace,
      },
      "Cloning repository"
    );

    const result = await commandRunner.run({
      command: "git",
      args: [
        "clone",
        "--depth",
        "1",
        "--branch",
        branch,
        repository,
        workspace,
      ],
      cwd: process.cwd(),
    });

    if (result.exitCode !== 0) {
      throw new Error(
        `Git clone failed: ${result.stderr}`
      );
    }

    logger.info(
      { workspace },
      "Repository cloned successfully"
    );
  }


  async build(
    workspace: string,
    command?: string
  ): Promise<void> {
    const buildCommand =
      command ?? "docker build -t deployment-image .";

    logger.info(
      {
        workspace,
        buildCommand,
      },
      "Starting build"
    );

    const result = await commandRunner.run({
      command: "sh",
      args: [
        "-c",
        buildCommand,
      ],
      cwd: workspace,

      onStdout(data) {
        logger.info({ data }, "Build output");
      },

      onStderr(data) {
        logger.warn({ data }, "Build stderr");
      },
    });

    if (result.exitCode !== 0) {
      throw new Error(
        `Build failed: ${result.stderr}`
      );
    }

    logger.info(
      { workspace },
      "Build completed"
    );
  }


  async push(): Promise<void> {
    logger.info("Push started");

    await new Promise((resolve) =>
      setTimeout(resolve, 1000)
    );

    logger.info("Push completed");
  }


  async deploy(
    workspace: string,
    command?: string
  ): Promise<void> {
    const deployCommand =
      command ?? "echo deployment-placeholder";

    logger.info(
      {
        workspace,
        deployCommand,
      },
      "Starting deployment"
    );

    const result = await commandRunner.run({
      command: "sh",
      args: [
        "-c",
        deployCommand,
      ],
      cwd: workspace,
    });

    if (result.exitCode !== 0) {
      throw new Error(
        `Deploy failed: ${result.stderr}`
      );
    }

    logger.info(
      "Deployment completed"
    );
  }
}