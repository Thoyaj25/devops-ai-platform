import { logger } from "@/lib/logger";
import { commandRunner } from "@/services/commandRunner/commandRunner";
import { deploymentLogService } from "@/services/deployment/logs/deploymentLogService";

import { DeploymentProvider } from "./deploymentProvider";

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
      "Repository cloned successfully"
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
    const image = process.env.DOCKER_IMAGE;

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
      {
        fullImage,
      },
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
      `Pushing image ${fullImage}`
    );


    logger.info(
      {
        fullImage,
      },
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
      {
        fullImage,
      },
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

    const registry =
      process.env.DOCKER_REGISTRY ?? "docker.io";


    const fullImage =
      `${registry}/${image}:${tag}`;


    /*
      Allocate application port.
      Container always runs on 3000.
      Host exposes dynamic port.
    */
    const port =
      3000 + Math.floor(Math.random() * 1000);


    const deployCommand =
      command ??
      `docker run -d \
-p ${port}:3000 \
-e HOSTNAME=0.0.0.0 \
--name dep-${deploymentId} \
${fullImage}`;


    await deploymentLogService.append(
      deploymentId,
      `Deploying ${fullImage} on port ${port}`
    );


    logger.info(
      {
        workspace,
        fullImage,
        port,
        deployCommand,
      },
      "Starting docker deployment"
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
      `Deployment finished successfully. URL: http://localhost:${port}`
    );


    logger.info(
      {
        fullImage,
        port,
      },
      "Deployment completed"
    );
  }
}