import type { Prisma } from "@/generated/prisma";
import type { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

// Reusable user projection
const defaultUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const authUserSelect = {
  ...defaultUserSelect,
  passwordHash: true,
} satisfies Prisma.UserSelect;

// Input types
type CreateUserData = {
  name: string;
  email: string;
  passwordHash?: string;
  role?: UserRole;
};

type UpdateUserData = Record<string, unknown>;

export const userRepository = {
  // -------------------------
  // Read operations
  // -------------------------

  /**
   * Returns the total count of users.
   */
  count() {
    return prisma.user.count();
  },

  findAll() {
    return prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: defaultUserSelect,
    });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: {
        id,
      },
      select: defaultUserSelect,
    });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: {
        email,
      },
      select: authUserSelect,
    });
  },

  exists(id: string) {
    return prisma.user.findUnique({
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

  create(data: CreateUserData) {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
      },
      select: defaultUserSelect,
    });
  },

  update(id: string, data: UpdateUserData) {
    return prisma.user.update({
      where: {
        id,
      },
      data,
      select: defaultUserSelect,
    });
  },

  delete(id: string) {
    return prisma.user.delete({
      where: {
        id,
      },
      select: defaultUserSelect,
    });
  },
};