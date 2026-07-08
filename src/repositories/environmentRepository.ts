import { EnvironmentType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export const environmentRepository = {
  findAllByProject(projectId: string) {
    return prisma.environment.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  },

  findById(id: string) {
    return prisma.environment.findUnique({
      where: {
        id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },

  create(data: {
    name: string;
    type: EnvironmentType;
    projectId: string;
  }) {
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
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },
};