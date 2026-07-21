import { commandRunner } from "@/services/commandRunner/commandRunner";
import { deploymentLogService } from "@/services/deployment/logs/deploymentLogService";
import {
  DeploymentProvider,
  DeployResult,
  ContainerInfo,
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

    const username = process.env.DOCKER_USER;
    const password = process.env.DOCKER_PASSWORD;

    if (!username || !password) {
      throw new Error(
        "Docker credentials (DOCKER_USER/DOCKER_PASSWORD) are missing"
      );
    }

    await deploymentLogService.append(
      deploymentId,
      `Authenticating with registry: ${registry}`
    );

    const loginResult = await commandRunner.run({
      command: "sh",
      args: [
        "-c",
        `echo ${password} | docker login ${registry} -u ${username} --password-stdin`,
      ],
      cwd: process.cwd(),
    });

    if (loginResult.exitCode !== 0) {
      throw new Error(
        `Docker login failed: ${loginResult.stderr}`
      );
    }

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
      throw new Error(
        `Push failed: ${result.stderr}`
      );
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
    const registry =
      process.env.DOCKER_REGISTRY ?? "docker.io";

    const fullImage =
      `${registry}/${image}:${tag}`;

    const containerName =
      `dep-${deploymentId}`;

    const hostPort = 0;

    const dockerNetwork =
      process.env.DOCKER_NETWORK ?? "marketsphere";

    await commandRunner.run({
      command: "docker",
      args: [
        "rm",
        "-f",
        containerName,
      ],
      cwd: workspace,
    });

    const envVars = [
      "DATABASE_URL",
      "REDIS_URL",
      "NEXTAUTH_SECRET",
      "NEXTAUTH_URL",
      "ADMIN_USER",
      "ADMIN_PASS",
      "NODE_ENV",
    ];

    const envArgs = envVars
      .filter((key) => process.env[key])
      .flatMap((key) => [
        "-e",
        `${key}=${process.env[key]}`,
      ]);

    const dockerArgs = [
      "run",
      "-d",
      "--name",
      containerName,
      "--hostname",
      containerName,
      "--network",
      dockerNetwork,
      "--network-alias",
      containerName,
      "--restart",
      "unless-stopped",
      "--label",
      `deploymentId=${deploymentId}`,
      "-p",
"0:3000",
      "-e",
      "HOSTNAME=0.0.0.0",
      ...envArgs,
      fullImage,
    ];

    const result = await commandRunner.run({
      command: "docker",
      args: dockerArgs,
      cwd: workspace,
      onStdout: (data) =>
        deploymentLogService.append(deploymentId, data),
      onStderr: (data) =>
        deploymentLogService.append(deploymentId, data),
    });

    if (result.exitCode !== 0) {
      throw new Error(
        `Deploy failed: ${result.stderr}`
      );
    }

    const containerId =
      result.stdout.trim();
      const portResult = await commandRunner.run({
  command: "docker",
  args: [
    "port",
    containerName,
    "3000",
  ],
  cwd: workspace,
});

const assignedPort = Number(
  portResult.stdout
    .trim()
    .split(":")
    .pop()
);

    return {
  containerId,
  containerName,
  hostPort: assignedPort,
  containerUrl:
    `http://${containerName}:3000`,
};
  }

  async stop(
    containerId: string
  ): Promise<void> {
    const result = await commandRunner.run({
      command: "docker",
      args: [
        "stop",
        containerId,
      ],
      cwd: process.cwd(),
    });

    if (result.exitCode !== 0) {
      throw new Error(
        `Failed to stop container ${containerId}: ${result.stderr}`
      );
    }
  }

  async start(
    containerId: string
  ): Promise<void> {
    const result = await commandRunner.run({
      command: "docker",
      args: [
        "start",
        containerId,
      ],
      cwd: process.cwd(),
    });

    if (result.exitCode !== 0) {
      throw new Error(
        `Failed to start container ${containerId}: ${result.stderr}`
      );
    }
  }

  async restart(
    containerId: string
  ): Promise<void> {
    const result = await commandRunner.run({
      command: "docker",
      args: [
        "restart",
        containerId,
      ],
      cwd: process.cwd(),
    });

    if (result.exitCode !== 0) {
      throw new Error(
        `Failed to restart container ${containerId}: ${result.stderr}`
      );
    }
  }

  async remove(
    containerId: string
  ): Promise<void> {
    const result = await commandRunner.run({
      command: "docker",
      args: [
        "rm",
        "-f",
        containerId,
      ],
      cwd: process.cwd(),
    });

    if (result.exitCode !== 0) {
      throw new Error(
        `Failed to remove container ${containerId}: ${result.stderr}`
      );
    }
  }

  async inspect(
    containerId: string
  ): Promise<ContainerInfo> {
    const result = await commandRunner.run({
      command: "docker",
      args: [
        "inspect",
        containerId,
      ],
      cwd: process.cwd(),
    });

    if (result.exitCode !== 0) {
      throw new Error(
        `Failed to inspect container ${containerId}: ${result.stderr}`
      );
    }

    const data = JSON.parse(result.stdout)[0];

    return {
      id: data.Id,
      name: data.Name.replace("/", ""),
      image: data.Config.Image,
      status: data.State.Status,
      running: data.State.Running,
    };
  }
}