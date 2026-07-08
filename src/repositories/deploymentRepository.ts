import { prisma } from "@/lib/prisma";

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
};