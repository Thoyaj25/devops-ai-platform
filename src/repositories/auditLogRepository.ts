import { prisma } from "@/lib/prisma";

export const auditLogRepository = {
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
        metadata: data.metadata,
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
};