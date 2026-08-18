import * as k8s from "@kubernetes/client-node";

import {
  DeploymentProvider,
  DeployResult,
  ContainerInfo,
} from "./deploymentProvider";

import { HealthCheckConfig } from "@/services/deployment/health/healthCheckConfig";
import { deploymentLogService } from "@/services/deployment/logs/deploymentLogService";
import { dockerClient } from "@/services/docker/dockerClient";
import { dockerImageService } from "@/services/docker/dockerImageService";

export class KubernetesDeploymentProvider
  implements DeploymentProvider
{
  private readonly namespace = "marketsphere";

  private readonly kc: k8s.KubeConfig;
  private readonly apps: k8s.AppsV1Api;
  private readonly core: k8s.CoreV1Api;

  constructor() {
    this.kc = new k8s.KubeConfig();
    this.kc.loadFromDefault();

    this.apps = this.kc.makeApiClient(k8s.AppsV1Api);
    this.core = this.kc.makeApiClient(k8s.CoreV1Api);
  }

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
  ): Promise<void> {
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
  ): Promise<void> {
    const image =
      process.env.DOCKER_IMAGE;

    if (!image) {
      throw new Error(
        "DOCKER_IMAGE environment variable missing"
      );
    }

    const tag = `${image}:${deploymentId}`;

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

  async push(
    _deploymentId: string,
    _image: string,
    _tag: string
  ): Promise<void> {
    // Image is already present in ECR.
  }

  async deploy(
    deploymentId: string,
    _workspace: string,
    image: string,
    tag: string,
    healthCheck: HealthCheckConfig,
    _jobId?: string
  ): Promise<DeployResult> {
    const name = `dep-${deploymentId}`;

    // For the current EKS demo, use the known-good ECR image.
    const fullImage =
      process.env.KUBERNETES_DEPLOYMENT_IMAGE?.trim() ||
      `${image}:${tag}`;

    await this.removeContainer(name);

    await this.apps.createNamespacedDeployment({
      namespace: this.namespace,
      body: {
        apiVersion: "apps/v1",
        kind: "Deployment",
        metadata: {
          name,
          labels: {
            "app.kubernetes.io/name": "marketsphere-deployment",
            "marketsphere.deployment": deploymentId,
          },
        },
        spec: {
          replicas: 1,
          selector: {
            matchLabels: {
              "marketsphere.deployment": deploymentId,
            },
          },
          template: {
            metadata: {
              labels: {
                "marketsphere.deployment": deploymentId,
              },
            },
            spec: {
              containers: [
                {
                  name: "app",
                  image: fullImage,
                  imagePullPolicy: "Always",
                  ports: [
                    {
                      containerPort: healthCheck.port,
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    });

    await this.core.createNamespacedService({
      namespace: this.namespace,
      body: {
        apiVersion: "v1",
        kind: "Service",
        metadata: {
          name,
          labels: {
            "marketsphere.deployment": deploymentId,
          },
        },
        spec: {
          selector: {
            "marketsphere.deployment": deploymentId,
          },
          ports: [
            {
              port: healthCheck.port,
              targetPort: healthCheck.port,
            },
          ],
        },
      },
    });

    return {
      containerId: name,
      containerName: name,
      hostPort: healthCheck.port,
      containerUrl:
        `http://${name}.${this.namespace}.svc.cluster.local:${healthCheck.port}`,
    };
  }

  async stop(containerId: string): Promise<void> {
    await this.apps.patchNamespacedDeployment({
      namespace: this.namespace,
      name: containerId,
      body: {
        spec: {
          replicas: 0,
        },
      },
    });
  }

  async start(containerId: string): Promise<void> {
    await this.apps.patchNamespacedDeployment({
      namespace: this.namespace,
      name: containerId,
      body: {
        spec: {
          replicas: 1,
        },
      },
    });
  }

  async restart(containerId: string): Promise<void> {
    await this.stop(containerId);
    await this.start(containerId);
  }

  async remove(containerId: string): Promise<void> {
    await this.removeContainer(containerId);
  }

  async removeContainer(containerName: string): Promise<void> {
    try {
      await this.core.deleteNamespacedService({
        namespace: this.namespace,
        name: containerName,
      });
    } catch {}

    try {
      await this.apps.deleteNamespacedDeployment({
        namespace: this.namespace,
        name: containerName,
      });
    } catch {}
  }

  async inspect(containerId: string): Promise<ContainerInfo> {
    const deployment =
      await this.apps.readNamespacedDeployment({
        namespace: this.namespace,
        name: containerId,
      });

    const available =
      deployment.status?.availableReplicas ?? 0;

    return {
      id: containerId,
      name: containerId,
      image:
        deployment.spec?.template.spec?.containers?.[0]?.image ?? "",
      status: available > 0 ? "running" : "pending",
      running: available > 0,
    };
  }

  async containerExists(containerId: string): Promise<boolean> {
    try {
      await this.apps.readNamespacedDeployment({
        namespace: this.namespace,
        name: containerId,
      });

      return true;
    } catch {
      return false;
    }
  }
}