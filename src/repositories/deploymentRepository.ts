import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

// Reusable include configuration
const defaultDeploymentInclude = {
  project: {
    select: {
      id: true,
      name: true,
    },
  },

  environment: {
    select: {
      id: true,
      name: true,
      type: true,
    },
  },

  pipeline: {
    select: {
      id: true,
      name: true,
      provider: true,
      repository: true,
      branch: true,
      buildCommand: true,
      deployCommand: true,
    },
  },

  jobs: {
    orderBy: {
      createdAt: "asc",
    },
  },
} satisfies Prisma.DeploymentInclude;

// Default ordering
const defaultOrder: Prisma.DeploymentOrderByWithRelationInput = {
  createdAt: "desc",
};

// Input types
type CreateDeploymentData = {
  version?: string;
  projectId: string;
  environmentId: string;
  pipelineId: string;
};

type UpdateDeploymentData =
  Parameters<typeof prisma.deployment.update>[0]["data"];

export const deploymentRepository = {
  // -------------------------
  // Read operations
  // -------------------------

  /**
   * Returns the total count of deployments.
   */
  count() {
    return prisma.deployment.count();
  },

  /**
   * Retrieves specific log and status data for a deployment.
   */
  findLogs(id: string) {
    return prisma.deployment.findUnique({
      where: { id },
      select: { logs: true, status: true },
    });
  },

  findAll() {
    return prisma.deployment.findMany({
      orderBy: defaultOrder,
      include: defaultDeploymentInclude,
    });
  },

  findAllByProject(projectId: string) {
    return prisma.deployment.findMany({
      where: {
        projectId,
      },
      orderBy: defaultOrder,
      include: defaultDeploymentInclude,
    });
  },

  findAllByEnvironment(environmentId: string) {
    return prisma.deployment.findMany({
      where: {
        environmentId,
      },
      orderBy: defaultOrder,
      include: defaultDeploymentInclude,
    });
  },

  findById(id: string) {
    return prisma.deployment.findUnique({
      where: {
        id,
      },
      include: defaultDeploymentInclude,
    });
  },

  exists(id: string) {
    return prisma.deployment.findUnique({
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

  /**
   * Appends logs to a deployment.
   */
  async updateLogs(id: string, logs: string) {
    return prisma.deployment.update({
      where: { id },
      data: { logs },
    });
  },

  create(data: CreateDeploymentData) {
    return prisma.deployment.create({
      data: {
        version: data.version,
        project: {
          connect: {
            id: data.projectId,
          },
        },
        environment: {
          connect: {
            id: data.environmentId,
          },
        },
        pipeline: {
          connect: {
            id: data.pipelineId,
          },
        },
      },
      include: defaultDeploymentInclude,
    });
  },

  update(id: string, data: UpdateDeploymentData) {
    return prisma.deployment.update({
      where: {
        id,
      },
      data,
      include: defaultDeploymentInclude,
    });
  },

  delete(id: string) {
    return prisma.deployment.delete({
      where: {
        id,
      },
    });
  },
};