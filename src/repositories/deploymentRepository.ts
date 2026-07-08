import { prisma } from "@/lib/prisma";
import { DeploymentStatus } from "@/generated/prisma/enums";

export const deploymentRepository = {
  async findAllByProject(projectId: string) {
    return prisma.deployment.findMany({
      where: {
        projectId,
      },
      include: {
        pipeline: true,
        environment: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  async findAllByEnvironment(environmentId: string) {
    return prisma.deployment.findMany({
      where: {
        environmentId,
      },
      include: {
        pipeline: true,
        project: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  async findAllByPipeline(pipelineId: string) {
    return prisma.deployment.findMany({
      where: {
        pipelineId,
      },
      include: {
        environment: true,
        project: true,
      },
      orderBy: {
        createdAt: "desc",
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
    status?: DeploymentStatus;
    logs?: string;
  }) {
    return prisma.deployment.create({
      data: {
        version: data.version,
        projectId: data.projectId,
        environmentId: data.environmentId,
        pipelineId: data.pipelineId,
        status: data.status ?? DeploymentStatus.RUNNING,
        logs: data.logs,
      },
    });
  },

  async updateStatus(
    id: string,
    status: DeploymentStatus,
    logs?: string
  ) {
    return prisma.deployment.update({
      where: {
        id,
      },
      data: {
        status,
        logs,
      },
    });
  },

  async delete(id: string) {
    return prisma.deployment.delete({
      where: {
        id,
      },
    });
  },
};