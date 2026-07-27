import "dotenv/config";

import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";

import {
  PrismaClient,
  EnvironmentType,
  UserRole,
} from "@/generated/prisma";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
  }),
});

async function main() {
  console.log("🌱 Seeding database...");

  const passwordHash = await bcrypt.hash("admin123", 10);

  // --------------------------------------------------
  // Admin User
  // --------------------------------------------------

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@marketsphere.local",
    },
    update: {
      name: "Administrator",
      passwordHash,
      role: UserRole.ADMIN,
    },
    create: {
      name: "Administrator",
      email: "admin@marketsphere.local",
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  // --------------------------------------------------
  // Cluster
  // --------------------------------------------------

  const cluster = await prisma.cluster.upsert({
    where: {
      id: "default-cluster",
    },
    update: {
      name: "Local Docker Cluster",
      provider: "Docker",
      region: "Local",
    },
    create: {
      id: "default-cluster",
      name: "Local Docker Cluster",
      provider: "Docker",
      region: "Local",
    },
  });

  // --------------------------------------------------
  // Project
  // --------------------------------------------------

  const existingProject = await prisma.project.findFirst({
    where: {
      ownerId: admin.id,
      name: "Demo Project",
    },
  });

  const project =
    existingProject ??
    (await prisma.project.create({
      data: {
        name: "Demo Project",
        description: "Default project",
        ownerId: admin.id,
        clusterId: cluster.id,
      },
    }));

  // --------------------------------------------------
  // Environments
  // --------------------------------------------------

  const environments = [
    {
      name: "Development",
      type: EnvironmentType.DEVELOPMENT,
    },
    {
      name: "Staging",
      type: EnvironmentType.STAGING,
    },
    {
      name: "Production",
      type: EnvironmentType.PRODUCTION,
    },
  ];

  for (const environment of environments) {
    const exists = await prisma.environment.findFirst({
      where: {
        projectId: project.id,
        name: environment.name,
      },
    });

    if (!exists) {
      await prisma.environment.create({
        data: {
          ...environment,
          projectId: project.id,
        },
      });
    }
  }

  // --------------------------------------------------
  // Pipeline
  // --------------------------------------------------

  const existingPipeline =
    await prisma.pipeline.findFirst({
      where: {
        projectId: project.id,
        name: "Default Pipeline",
      },
    });

  if (!existingPipeline) {
    await prisma.pipeline.create({
      data: {
        name: "Default Pipeline",
        provider: "Docker",
        repository: "",
        branch: "main",
        buildCommand: "npm install && npm run build",
        deployCommand: "docker compose up -d",
        projectId: project.id,
      },
    });
  }

  console.log("");
  console.log("====================================");
  console.log("✅ Database seeded successfully");
  console.log("====================================");
  console.log("Admin Email    : admin@marketsphere.local");
  console.log("Admin Password : admin123");
  console.log("====================================");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });