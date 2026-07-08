import { prisma } from "@/lib/prisma";

export const pipelineRepository = {
  async findAllByProject(projectId: string) {
    return prisma.pipeline.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  async findById(id: string) {
    return prisma.pipeline.findUnique({
      where: {
        id,
      },
    });
  },

  async create(data: {
    name: string;
    provider?: string;
    repository?: string;
    projectId: string;
  }) {
    return prisma.pipeline.create({
      data,
    });
  },
};