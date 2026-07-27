import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

const connectionString = process.env.DATABASE_URL;

function createPrismaClient(): PrismaClient {
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set.");
  }

  const adapter = new PrismaPg({
    connectionString,
  });

  return new PrismaClient({
    adapter,
  });
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}