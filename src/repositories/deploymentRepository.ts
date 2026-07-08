import { prisma } from "@/lib/prisma";
import { DeploymentStatus } from "@/generated/prisma/enums";

export const deploymentRepository = {
  async findAllByEnvironment(environmentId: string) {
    return prisma.deployment.findMany({
      where: {
        environmentId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        pipeline: true,
      },
    });
  },

  async findById(id: string) {
    return prisma.deployment.findUnique({
      where: {
        id,
      },
      include: {
        pipeline: true,
        environment: true,
        project: true,
      },
    });
  },

  async create(data: {
    version?: string;
    projectId: string;
    environmentId: string;
    pipelineId: string;
  }) {
    return prisma.deployment.create({
      data: {
        version: data.version,
        projectId: data.projectId,
        environmentId: data.environmentId,
        pipelineId: data.pipelineId,
      },
    });
  },

  async updateStatus(id: string, status: DeploymentStatus, logs?: string) {
    return prisma.deployment.update({
      where: { id },
      data: {
        status,
        logs,
      },
    });
  },
};