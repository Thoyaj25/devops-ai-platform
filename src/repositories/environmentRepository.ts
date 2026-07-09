import type { Prisma } from "@/generated/prisma";
import type { EnvironmentType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

// Reusable include configuration
const defaultEnvironmentInclude = {
  project: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.EnvironmentInclude;

// Default ordering
const defaultOrder: Prisma.EnvironmentOrderByWithRelationInput = {
  createdAt: "asc",
};

// Input types
type CreateEnvironmentData = {
  name: string;
  type: EnvironmentType;
  projectId: string;
};

// Derive the exact update type expected by the Prisma client
type UpdateEnvironmentData =
  Parameters<typeof prisma.environment.update>[0]["data"];

export const environmentRepository = {
  // -------------------------
  // Read operations
  // -------------------------

  findAllByProject(projectId: string) {
    return prisma.environment.findMany({
      where: {
        projectId,
      },
      orderBy: defaultOrder,
      include: defaultEnvironmentInclude,
    });
  },

  findById(id: string) {
    return prisma.environment.findUnique({
      where: {
        id,
      },
      include: defaultEnvironmentInclude,
    });
  },

  exists(id: string) {
    return prisma.environment.findUnique({
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

  create(data: CreateEnvironmentData) {
    return prisma.environment.create({
      data: {
        name: data.name,
        type: data.type,
        project: {
          connect: {
            id: data.projectId,
          },
        },
      },
      include: defaultEnvironmentInclude,
    });
  },

  update(id: string, data: UpdateEnvironmentData) {
    return prisma.environment.update({
      where: {
        id,
      },
      data,
      include: defaultEnvironmentInclude,
    });
  },

  delete(id: string) {
    return prisma.environment.delete({
      where: {
        id,
      },
    });
  },
};