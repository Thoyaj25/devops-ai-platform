import { deploymentLogService } from "@/services/deployment/logs/deploymentLogService";

import {
  DeploymentProvider,
  DeployResult,
  ContainerInfo,
} from "./deploymentProvider";

import { dockerClient } from "@/services/docker/dockerClient";
import { dockerContainerService } from "@/services/docker/dockerContainerService";
import { dockerImageService } from "@/services/docker/dockerImageService";

import { deploymentHealthChecker } from "@/services/deployment/health/deploymentHealthChecker";
import { HealthCheckConfig } from "@/services/deployment/health/healthCheckConfig";

export class DockerDeploymentProvider
  implements DeploymentProvider {

  private domain =
    process.env.DEPLOYMENT_DOMAIN ??
    "marketsphere.local";

  private async log(
    deploymentId: string,
    message: string
  ) {
    return deploymentLogService.append(
      deploymentId,
      message
    );
  }

  async checkout(
    deploymentId: string,
    repository: string,
    workspace: string,
    branch = "main"
  ) {
    await this.log(
      deploymentId,
      `Cloning repository ${repository}`
    );

    await dockerClient.removeWorkspace(
      workspace
    );

    await dockerClient.gitClone(
  repository,
  workspace,
  branch,
  {
    onStdout: async (line) => {
      await deploymentLogService.append(
        deploymentId,
        line,
        "CHECKOUT"
      );
    },

    onStderr: async (line) => {
      await deploymentLogService.append(
        deploymentId,
        line,
        "CHECKOUT"
      );
    },
  }
);

    await this.log(
      deploymentId,
      "Repository checkout completed"
    );
  }

  async build(
    deploymentId: string,
    workspace: string,
    jobId?: string
  ) {
    const image =
      process.env.DOCKER_IMAGE;

    if (!image) {
      throw new Error(
        "DOCKER_IMAGE environment variable missing"
      );
    }

    const tag =
      `${image}:${deploymentId}`;

    await this.log(
      deploymentId,
      `Building docker image ${tag}`
    );

    await dockerImageService.build(
    workspace,
    tag,
    jobId,
    {
        onStdout: async (line) => {
            await deploymentLogService.append(
                deploymentId,
                line,
                "BUILD"
            );
        },

        onStderr: async (line) => {
            await deploymentLogService.append(
                deploymentId,
                line,
                "BUILD"
            );
        },
    }
);

    await this.log(
      deploymentId,
      "Docker image build completed"
    );
  }

  async deploy(
    deploymentId: string,
    workspace: string,
    image: string,
    tag: string,
    healthCheck: HealthCheckConfig,
    jobId?: string
  ): Promise<DeployResult> {
    const fullImage = `${image}:${tag}`;

    const containerName = `dep-${deploymentId}`;

    await this.log(
      deploymentId,
      `Creating container ${containerName}`
    );

    await dockerContainerService.remove(
      containerName
    );

    const containerId =
  await dockerContainerService.run({
    name: containerName,
    image: fullImage,
    network: "marketsphere",
    labels: {
      "marketsphere.managed": "true",
      "marketsphere.deployment": deploymentId,
    },
  });

    await dockerContainerService.waitRunning(
  containerId
);

await dockerContainerService.waitHealthy(
  containerName,
  healthCheck.startupTimeout
);

await deploymentHealthChecker.check(
  containerName,
  healthCheck,
  jobId
);

    const containerUrl = `http://${deploymentId}.${this.domain}`;

    await this.log(
      deploymentId,
      `Deployment healthy ${containerUrl}`
    );

    return {
      containerId,
      containerName,
      hostPort: 3000,
      containerUrl,
    };
  }

  async inspect(
    id: string
  ): Promise<ContainerInfo> {
    return dockerContainerService.inspect(
      id
    );
  }

  async exists(
    id: string
  ): Promise<boolean> {
    return dockerContainerService.exists(
      id
    );
  }

  async containerExists(
    id: string
  ): Promise<boolean> {
    return this.exists(id);
  }

  async stop(
    id: string
  ): Promise<void> {
    await dockerContainerService.stop(
      id
    );
  }

  async start(
    id: string
  ): Promise<void> {
    await dockerContainerService.start(
      id
    );
  }

  async restart(
    id: string
  ): Promise<void> {
    await dockerContainerService.restart(
      id
    );
  }

  async remove(
    id: string
  ): Promise<void> {
    await dockerContainerService.remove(
      id
    );
  }

  async removeContainer(
    name: string
  ): Promise<void> {
    await dockerContainerService.remove(
      name
    );
  }

  async push(
    deploymentId: string,
    image: string,
    tag: string
  ): Promise<void> {
    await this.log(
      deploymentId,
      `Pushing image ${image}:${tag}`
    );

    await dockerImageService.push(
      `${image}:${tag}`
    );

    await this.log(
      deploymentId,
      "Image push completed"
    );
  }
}