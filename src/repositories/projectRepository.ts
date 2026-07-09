import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

const defaultProjectInclude = {
  owner: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.ProjectInclude;

const defaultOrder: Prisma.ProjectOrderByWithRelationInput = {
  createdAt: "desc",
};

type CreateProjectData = {
  name: string;
  description?: string;
  ownerId: string;
};

type UpdateProjectData = Record<string, unknown>;

export const projectRepository = {
  // Read

  findAll() {
    return prisma.project.findMany({
      orderBy: defaultOrder,
      include: defaultProjectInclude,
    });
  },

  findById(id: string) {
    return prisma.project.findUnique({
      where: { id },
      include: defaultProjectInclude,
    });
  },

  findByIdForOwner(id: string, ownerId: string) {
    return prisma.project.findFirst({
      where: {
        id,
        ownerId,
      },
      include: defaultProjectInclude,
    });
  },

  exists(id: string) {
    return prisma.project.findUnique({
      where: { id },
      select: { id: true },
    });
  },

  // Write

  create(data: CreateProjectData) {
    return prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        owner: {
          connect: {
            id: data.ownerId,
          },
        },
      },
      include: defaultProjectInclude,
    });
  },

  update(id: string, data: UpdateProjectData) {
    return prisma.project.update({
      where: { id },
      data,
      include: defaultProjectInclude,
    });
  },

  delete(id: string) {
    return prisma.project.delete({
      where: { id },
    });
  },
};