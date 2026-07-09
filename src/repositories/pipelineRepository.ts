import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

// Reusable include configuration
const defaultPipelineInclude = {
  project: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.PipelineInclude;

// Default ordering
const defaultOrder: Prisma.PipelineOrderByWithRelationInput = {
  createdAt: "desc",
};

// Input types

type CreatePipelineData = {
  name: string;
  provider?: string;
  repository?: string;
  projectId: string;
};

type UpdatePipelineData =
  Parameters<typeof prisma.pipeline.update>[0]["data"];

export const pipelineRepository = {
  // -------------------------
  // Read operations
  // -------------------------

  findAllByProject(projectId: string) {
    return prisma.pipeline.findMany({
      where: {
        projectId,
      },
      orderBy: defaultOrder,
      include: defaultPipelineInclude,
    });
  },

  findAll() {
    return prisma.pipeline.findMany({
      orderBy: defaultOrder,
      include: defaultPipelineInclude,
    });
  },

  findById(id: string) {
    return prisma.pipeline.findUnique({
      where: {
        id,
      },
      include: defaultPipelineInclude,
    });
  },

  exists(id: string) {
    return prisma.pipeline.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });
  },


  // -------------------------
  // Write operations
  // -------------------------

  create(data: CreatePipelineData) {
    return prisma.pipeline.create({
      data: {
        name: data.name,
        provider: data.provider,
        repository: data.repository,

        project: {
          connect: {
            id: data.projectId,
          },
        },
      },
      include: defaultPipelineInclude,
    });
  },


  update(id: string, data: UpdatePipelineData) {
    return prisma.pipeline.update({
      where: {
        id,
      },
      data,
      include: defaultPipelineInclude,
    });
  },


  delete(id: string) {
    return prisma.pipeline.delete({
      where: {
        id,
      },
    });
  },
};