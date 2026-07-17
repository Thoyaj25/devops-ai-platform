import { logger } from "@/lib/logger";
import { DeploymentProvider } from "./deploymentProvider";
import { commandRunner } from "@/services/commandRunner/commandRunner";
import { deploymentLogService } from "@/services/deployment/logs/deploymentLogService";

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

    await deploymentLogService.append(
      deploymentId,
      "Repository cloned"
    );

    logger.info(
      { workspace },
      "Repository cloned successfully"
    );
  }


  async build(
    deploymentId: string,
    workspace: string,
    command?: string
  ): Promise<void> {
    const image =
      process.env.DOCKER_IMAGE;

    if (!image) {
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


    logger.info(
      {
        workspace,
        fullImage,
        buildCommand,
      },
      "Starting docker build"
    );


    const result =
      await commandRunner.run({
        command: "sh",
        args: [
          "-c",
          buildCommand,
        ],
        cwd: workspace,

        onStdout: (data) =>
          deploymentLogService.append(
            deploymentId,
            data
          ),

        onStderr: (data) =>
          deploymentLogService.append(
            deploymentId,
            data
          ),
      });


    if (result.exitCode !== 0) {
      throw new Error(
        `Build failed: ${result.stderr}`
      );
    }


    await deploymentLogService.append(
      deploymentId,
      `Image built successfully ${fullImage}`
    );


    logger.info(
      { fullImage },
      "Docker build completed"
    );
  }



  async push(
    deploymentId: string,
    image: string,
    tag: string
  ): Promise<void> {

    const registry =
      process.env.DOCKER_REGISTRY ?? "docker.io";


    const fullImage =
      `${registry}/${image}:${tag}`;


    await deploymentLogService.append(
      deploymentId,
      `Pushing ${fullImage}`
    );


    logger.info(
      { fullImage },
      "Pushing docker image"
    );


    const result =
      await commandRunner.run({
        command: "docker",
        args: [
          "push",
          fullImage,
        ],
        cwd: process.cwd(),
      });


    if (result.exitCode !== 0) {
      throw new Error(
        `Push failed: ${result.stderr}`
      );
    }


    await deploymentLogService.append(
      deploymentId,
      "Image push completed"
    );


    logger.info(
      { fullImage },
      "Docker push completed"
    );
  }



  async deploy(
    deploymentId: string,
    workspace: string,
    image: string,
    tag: string,
    command?: string
  ): Promise<void> {


    const deployCommand =
      command ??
      "echo deployment-placeholder";


    await deploymentLogService.append(
      deploymentId,
      `Deploying using ${deployCommand}`
    );


    logger.info(
      {
        workspace,
        deployCommand,
      },
      "Starting deployment"
    );


    const result =
      await commandRunner.run({
        command: "sh",
        args: [
          "-c",
          deployCommand,
        ],
        cwd: workspace,

        onStdout: (data) =>
          deploymentLogService.append(
            deploymentId,
            data
          ),

        onStderr: (data) =>
          deploymentLogService.append(
            deploymentId,
            data
          ),
      });


    if (result.exitCode !== 0) {
      throw new Error(
        `Deploy failed: ${result.stderr}`
      );
    }


    await deploymentLogService.append(
      deploymentId,
      "Deployment finished"
    );


    logger.info(
      "Deployment completed"
    );
  }
}