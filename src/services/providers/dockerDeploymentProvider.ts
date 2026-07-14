import { logger } from "@/lib/logger";
import { DeploymentProvider } from "./deploymentProvider";
import { commandRunner } from "@/services/commandRunner/commandRunner";
import { deploymentLogService } from "@/services/deployment/logs/deploymentLogService";

export class DockerDeploymentProvider implements DeploymentProvider {
  async checkout(
    deploymentId: string, // Step 2: Added deploymentId to all methods
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

  async push(deploymentId: string): Promise<void> {
    await deploymentLogService.append(deploymentId, "Pushing image...");
    logger.info("Push started");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await deploymentLogService.append(deploymentId, "Push finished");
    logger.info("Push completed");
  }

  async deploy(
    deploymentId: string,
    workspace: string,
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