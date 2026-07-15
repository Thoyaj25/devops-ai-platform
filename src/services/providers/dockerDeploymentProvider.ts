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
    await deploymentLogService.append(deploymentId, `Cloning repository ${repository} (branch: ${branch})...`);

    logger.info({ repository, branch, workspace }, "Cloning repository");

    const result = await commandRunner.run({
      command: "git",
      args: ["clone", "--depth", "1", "--branch", branch, repository, workspace],
      cwd: process.cwd(),
    });

    if (result.exitCode !== 0) {
      throw new Error(`Git clone failed: ${result.stderr}`);
    }

    await deploymentLogService.append(deploymentId, "Repository cloned");
    logger.info({ workspace }, "Repository cloned successfully");
  }

  async build(
    deploymentId: string,
    workspace: string,
    command?: string
  ): Promise<void> {
    // Step 2: Use the provided command which now contains the full image tag
    const buildCommand = command ?? "docker build -t deployment-image .";
    await deploymentLogService.append(deploymentId, `Building with command: ${buildCommand}...`);

    logger.info({ workspace, buildCommand }, "Starting build");

    const result = await commandRunner.run({
      command: "sh",
      args: ["-c", buildCommand],
      cwd: workspace,
      onStdout: (data) => deploymentLogService.append(deploymentId, data),
      onStderr: (data) => deploymentLogService.append(deploymentId, data),
    });

    if (result.exitCode !== 0) {
      throw new Error(`Build failed: ${result.stderr}`);
    }

    await deploymentLogService.append(deploymentId, "Build completed");
    logger.info({ workspace }, "Build completed");
  }

  // Step 3 & 4: Simplified push using full image name from environment
  async push(deploymentId: string, image: string, tag: string): Promise<void> {
    const registry = process.env.DOCKER_REGISTRY ?? "docker.io";

    // image is expected to be in the format 'username/repo'
    const fullImage = `${registry}/${image}:${tag}`;

    await deploymentLogService.append(deploymentId, `Pushing image ${fullImage}...`);

    const pushResult = await commandRunner.run({
      command: "docker",
      args: ["push", fullImage],
      cwd: process.cwd(),
    });

    if (pushResult.exitCode !== 0) {
      throw new Error(`Push failed: ${pushResult.stderr}`);
    }

    await deploymentLogService.append(deploymentId, "Push finished");
    logger.info({ fullImage }, "Push completed");
  }

  async deploy(
    deploymentId: string,
    workspace: string,
    image: string,
    tag: string,
    command?: string
  ): Promise<void> {
    const deployCommand = command ?? "echo deployment-placeholder";
    await deploymentLogService.append(deploymentId, `Deploying with command: ${deployCommand}...`);

    logger.info({ workspace, deployCommand }, "Starting deployment");

    const result = await commandRunner.run({
      command: "sh",
      args: ["-c", deployCommand],
      cwd: workspace,
      onStdout: (data) => deploymentLogService.append(deploymentId, data),
      onStderr: (data) => deploymentLogService.append(deploymentId, data),
    });

    if (result.exitCode !== 0) {
      throw new Error(`Deploy failed: ${result.stderr}`);
    }

    await deploymentLogService.append(deploymentId, "Deployment finished");
    logger.info("Deployment completed");
  }
}