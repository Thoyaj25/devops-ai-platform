import { DeploymentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

type DeploymentJobStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

type DeploymentJobRecord = {
  id: string;
  deploymentId: string;
  status: DeploymentJobStatus;
  error?: string | null;
};

function mapToJobStatus(status: string): DeploymentJobStatus {
  switch (status) {
    case "RUNNING":
      return "RUNNING";
    case "SUCCESS":
      return "COMPLETED";
    case "FAILED":
      return "FAILED";
    default:
      return "PENDING";
  }
}

function mapToDeploymentStatus(status: DeploymentJobStatus): DeploymentStatus {
  switch (status) {
    case "RUNNING":
      return DeploymentStatus.RUNNING;
    case "COMPLETED":
      return DeploymentStatus.SUCCESS;
    case "FAILED":
      return DeploymentStatus.FAILED;
    default:
      return DeploymentStatus.RUNNING;
  }
}

function toDeploymentJobRecord(deployment: {
  id: string;
  status: string;
}): DeploymentJobRecord {
  return {
    id: deployment.id,
    deploymentId: deployment.id,
    status: mapToJobStatus(deployment.status),
  };
}

export const deploymentJobRepository = {
  async create(deploymentId: string): Promise<DeploymentJobRecord> {
    const deployment = await prisma.deployment.update({
      where: { id: deploymentId },
      data: { status: DeploymentStatus.RUNNING },
    });

    return toDeploymentJobRecord(deployment);
  },

  async findPending(): Promise<DeploymentJobRecord[]> {
    const deployments = await prisma.deployment.findMany({
      where: { status: DeploymentStatus.RUNNING },
      orderBy: { createdAt: "asc" },
    });

    return deployments.map(toDeploymentJobRecord);
  },

  async update(
    id: string,
    data: {
      status: DeploymentJobStatus;
      error?: string;
    }
  ): Promise<DeploymentJobRecord> {
    const deployment = await prisma.deployment.update({
      where: { id },
      data: { status: mapToDeploymentStatus(data.status) },
    });

    return {
      id: deployment.id,
      deploymentId: deployment.id,
      status: mapToJobStatus(deployment.status),
      error: data.error ?? null,
    };
  },
};