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
    await deploymentLogService.append(deploymentId, `Cloning repository ${repository} (${branch})`);

    const result = await commandRunner.run({
      command: "git",
      args: ["clone", "--depth", "1", "--branch", branch, repository, workspace],
      cwd: process.cwd(),
    });

    if (result.exitCode !== 0) throw new Error(`Git clone failed: ${result.stderr}`);

    await deploymentLogService.append(deploymentId, "Repository cloned successfully");
  }

  async build(
    deploymentId: string,
    workspace: string,
    command?: string
  ): Promise<void> {
    const image = process.env.DOCKER_IMAGE;
    if (!image) throw new Error("DOCKER_IMAGE is not configured");

    const registry = process.env.DOCKER_REGISTRY ?? "docker.io";
    const fullImage = `${registry}/${image}:${deploymentId}`;
    const buildCommand = command ?? `docker build -t ${fullImage} .`;

    await deploymentLogService.append(deploymentId, `Building image ${fullImage}`);

    const result = await commandRunner.run({
      command: "sh",
      args: ["-c", buildCommand],
      cwd: workspace,
      onStdout: (data) => deploymentLogService.append(deploymentId, data),
      onStderr: (data) => deploymentLogService.append(deploymentId, data),
    });

    if (result.exitCode !== 0) throw new Error(`Build failed: ${result.stderr}`);

    await deploymentLogService.append(deploymentId, "Build completed successfully");
  }

  async push(deploymentId: string, image: string, tag: string): Promise<void> {
    const registry = process.env.DOCKER_REGISTRY ?? "docker.io";
    const fullImage = `${registry}/${image}:${tag}`;
    const username = process.env.DOCKER_USER;
    const password = process.env.DOCKER_PASSWORD;

    if (!username || !password) {
      throw new Error("Docker credentials (DOCKER_USER/DOCKER_PASSWORD) are missing");
    }

    await deploymentLogService.append(deploymentId, `Authenticating with registry: ${registry}`);

    // Step 2 — Login before push
    const loginResult = await commandRunner.run({
      command: "sh",
      args: ["-c", `echo ${password} | docker login ${registry} -u ${username} --password-stdin`],
      cwd: process.cwd(),
    });

    if (loginResult.exitCode !== 0) {
      throw new Error(`Docker login failed: ${loginResult.stderr}`);
    }

    await deploymentLogService.append(deploymentId, `Pushing ${fullImage}`);

    const result = await commandRunner.run({
      command: "docker",
      args: ["push", fullImage],
      cwd: process.cwd(),
      onStdout: (data) => deploymentLogService.append(deploymentId, data),
      onStderr: (data) => deploymentLogService.append(deploymentId, data),
    });

    if (result.exitCode !== 0) throw new Error(`Push failed: ${result.stderr}`);

    await deploymentLogService.append(deploymentId, "Image pushed successfully");
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
    const hostPort = 3000 + Math.floor(Math.random() * 1000);

    await commandRunner.run({ command: "docker", args: ["rm", "-f", containerName], cwd: workspace });

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
      .flatMap((key) => ["-e", `${key}=${process.env[key]}`]);

    const dockerArgs = [
  "run",
  "-d",

  // Put deployment container on the same network as the worker
  "--network",
  "marketsphere_default",

  "--name",
  containerName,

  "-p",
  `${hostPort}:3000`,

  "-e",
  "HOSTNAME=0.0.0.0",

  ...envArgs,

  fullImage,
];

    await deploymentLogService.append(deploymentId, `Deploying with args: ${dockerArgs.join(' ')}`);

    const result = await commandRunner.run({
      command: "docker",
      args: dockerArgs,
      cwd: workspace,
      onStdout: (d) => deploymentLogService.append(deploymentId, d),
      onStderr: (d) => deploymentLogService.append(deploymentId, d)
    });

    if (result.exitCode !== 0) throw new Error(`Deploy failed: ${result.stderr}`);

    const containerId = result.stdout.trim();
    return {
    containerId,
    hostPort,

    // Used by the worker for health checks
    containerUrl: `http://${containerName}:3000`,
};
  }

  async stop(containerId: string): Promise<void> {
    const result = await commandRunner.run({ command: "docker", args: ["stop", containerId], cwd: process.cwd() });
    if (result.exitCode !== 0) throw new Error(result.stderr);
  }

  async start(containerId: string): Promise<void> {
    const result = await commandRunner.run({ command: "docker", args: ["start", containerId], cwd: process.cwd() });
    if (result.exitCode !== 0) throw new Error(result.stderr);
  }

  async restart(containerId: string): Promise<void> {
    const result = await commandRunner.run({ command: "docker", args: ["restart", containerId], cwd: process.cwd() });
    if (result.exitCode !== 0) throw new Error(result.stderr);
  }

  async remove(containerId: string): Promise<void> {
    const result = await commandRunner.run({ command: "docker", args: ["rm", "-f", containerId], cwd: process.cwd() });
    if (result.exitCode !== 0) throw new Error(result.stderr);
  }

  async inspect(containerId: string): Promise<ContainerInfo> {
    const result = await commandRunner.run({ command: "docker", args: ["inspect", containerId], cwd: process.cwd() });
    if (result.exitCode !== 0) throw new Error(result.stderr || `Failed to inspect ${containerId}`);

    const container = JSON.parse(result.stdout)[0];
    return {
      id: container.Id,
      name: container.Name.replace("/", ""),
      image: container.Config.Image,
      status: container.State.Status,
      running: container.State.Running,
    };
  }
}