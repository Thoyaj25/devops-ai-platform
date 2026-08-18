import * as k8s from "@kubernetes/client-node";

import {
  DeploymentProvider,
  DeployResult,
  ContainerInfo,
} from "./deploymentProvider";

import { HealthCheckConfig } from "@/services/deployment/health/healthCheckConfig";

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

  async checkout(
    _deploymentId: string,
    _repository: string,
    _workspace: string,
    _branch = "main"
  ): Promise<void> {
    throw new Error(
      "Kubernetes provider checkout is not implemented yet"
    );
  }

  async build(
    _deploymentId: string,
    _workspace: string,
    _command?: string
  ): Promise<void> {
    throw new Error(
      "Kubernetes image build is not implemented yet"
    );
  }

  async push(
    _deploymentId: string,
    _image: string,
    _tag: string
  ): Promise<void> {
    throw new Error(
      "Kubernetes image push is not implemented yet"
    );
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
    const fullImage = `${image}:${tag}`;

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
      containerUrl: `http://${name}.${this.namespace}.svc.cluster.local:${healthCheck.port}`,
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
        deployment.spec?.template.spec?.containers?.[0]
          ?.image ?? "",
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
