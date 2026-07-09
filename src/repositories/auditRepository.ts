import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";


// Reusable relation selection
const defaultAuditInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.AuditLogInclude;


// Create input

type CreateAuditData = {
  action: string;
  resource: string;
  userId?: string;
  metadata?: Prisma.InputJsonValue;
};


export const auditRepository = {

  // -------------------------
  // Read operations
  // -------------------------

  findAll() {
    return prisma.auditLog.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: defaultAuditInclude,
    });
  },


  findById(id: string) {
    return prisma.auditLog.findUnique({
      where: {
        id,
      },
      include: defaultAuditInclude,
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
      include: defaultAuditInclude,
    });
  },


  // -------------------------
  // Write operations
  // -------------------------

  create(data: CreateAuditData) {
    if (data.userId) {
      return prisma.auditLog.create({
        data: {
          action: data.action,
          resource: data.resource,
          user: {
            connect: {
              id: data.userId,
            },
          },
          metadata: data.metadata,
        },

        include: defaultAuditInclude,
      });
    }

    return prisma.auditLog.create({
      data: {
        action: data.action,
        resource: data.resource,
        user: {
          connect: undefined,
        } as never,
        metadata: data.metadata,
      } as never,

      include: defaultAuditInclude,
    });
  },


  delete(id: string) {
    return prisma.auditLog.delete({
      where: {
        id,
      },
    });
  },
};