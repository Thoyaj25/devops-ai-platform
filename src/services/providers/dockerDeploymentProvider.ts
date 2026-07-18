import { commandRunner } from "@/services/commandRunner/commandRunner";
import { deploymentLogService } from "@/services/deployment/logs/deploymentLogService";
import {
  DeploymentProvider,
  DeployResult,
} from "./deploymentProvider";

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
      throw new Error(`Git clone failed: ${result.stderr}`);
    }

    await deploymentLogService.append(
      deploymentId,
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
      throw new Error("DOCKER_IMAGE is not configured");
    }

    const registry = process.env.DOCKER_REGISTRY ?? "docker.io";
    const fullImage = `${registry}/${image}:${deploymentId}`;

    const buildCommand =
      command ?? `docker build -t ${fullImage} .`;

    await deploymentLogService.append(
      deploymentId,
      `Building image ${fullImage}`
    );

    const result = await commandRunner.run({
      command: "sh",
      args: ["-c", buildCommand],
      cwd: workspace,
      onStdout: (data) =>
        deploymentLogService.append(deploymentId, data),
      onStderr: (data) =>
        deploymentLogService.append(deploymentId, data),
    });

    if (result.exitCode !== 0) {
      throw new Error(`Build failed: ${result.stderr}`);
    }

    await deploymentLogService.append(
      deploymentId,
      "Build completed successfully"
    );
  }

  async push(
    deploymentId: string,
    image: string,
    tag: string
  ): Promise<void> {
    const registry = process.env.DOCKER_REGISTRY ?? "docker.io";
    const fullImage = `${registry}/${image}:${tag}`;

    await deploymentLogService.append(
      deploymentId,
      `Pushing ${fullImage}`
    );

    const result = await commandRunner.run({
      command: "docker",
      args: ["push", fullImage],
      cwd: process.cwd(),
      onStdout: (data) =>
        deploymentLogService.append(deploymentId, data),
      onStderr: (data) =>
        deploymentLogService.append(deploymentId, data),
    });

    if (result.exitCode !== 0) {
      throw new Error(`Push failed: ${result.stderr}`);
    }

    await deploymentLogService.append(
      deploymentId,
      "Image pushed successfully"
    );
  }

  async deploy(
    deploymentId: string,
    workspace: string,
    image: string,
    tag: string,
    command?: string
  ): Promise<DeployResult> {
    const registry = process.env.DOCKER_REGISTRY ?? "docker.io";
    const fullImage = `${registry}/${image}:${tag}`;

    const containerName = `dep-${deploymentId}`;
    const port = 3000 + Math.floor(Math.random() * 1000);

    await deploymentLogService.append(
      deploymentId,
      `Removing any existing container named ${containerName}`
    );

    // Ignore errors if container doesn't exist
    await commandRunner.run({
      command: "docker",
      args: ["rm", "-f", containerName],
      cwd: workspace,
    });

    const envVars = [
      "DATABASE_URL",
      "NEXTAUTH_SECRET",
      "NEXTAUTH_URL",
      "ADMIN_USER",
      "ADMIN_PASS",
      "NODE_ENV",
    ];

    const envArgs = envVars
      .filter((key) => process.env[key])
      .map((key) => `-e ${key}="${process.env[key]}"`)
      .join(" ");

    const deployCommand =
      command ??
      `
docker run -d \
--name ${containerName} \
-p ${port}:3000 \
-e HOSTNAME=0.0.0.0 \
${envArgs} \
${fullImage}
      `.trim();

    await deploymentLogService.append(
      deploymentId,
      `Deploying ${fullImage} on port ${port}`
    );

    const result = await commandRunner.run({
      command: "sh",
      args: ["-c", deployCommand],
      cwd: workspace,
      onStdout: (data) =>
        deploymentLogService.append(deploymentId, data),
      onStderr: (data) =>
        deploymentLogService.append(deploymentId, data),
    });

    if (result.exitCode !== 0) {
      throw new Error(`Deploy failed: ${result.stderr}`);
    }

    const containerId = result.stdout.trim();

    await deploymentLogService.append(
      deploymentId,
      `Container started: ${containerId}`
    );

    return {
      containerId,
      hostPort: port,
      containerUrl: `http://localhost:${port}`,
    };
  }
}