import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const auditRepository = {
  create(data: {
    action: string;
    resource: string;
    userId: string;
    metadata?: object;
  }) {
    return prisma.auditLog.create({
      data: {
        action: data.action,
        resource: data.resource,
        userId: data.userId,
        metadata: data.metadata as Prisma.InputJsonValue,
      },
    });
  },

  findAll() {
    return prisma.auditLog.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  },

  findByUser(userId: string) {
    return prisma.auditLog.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },
};