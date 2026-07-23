import {
  Prisma,
  DeploymentStatus,
} from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

const deploymentInclude = {
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

const defaultOrder: Prisma.DeploymentOrderByWithRelationInput = {
  createdAt: "desc",
};

type CreateDeploymentData = {
  version?: string;
  projectId: string;
  environmentId: string;
  pipelineId: string;
};

type UpdateDeploymentData =
  Prisma.DeploymentUpdateInput;

export const deploymentRepository = {
  // ------------------------------------------------------------------
  // Read
  // ------------------------------------------------------------------

  count() {
    return prisma.deployment.count();
  },

  exists(id: string) {
    return prisma.deployment.findUnique({
      where: { id },
      select: {
        id: true,
      },
    });
  },

  findLogs(id: string) {
    return prisma.deployment.findUnique({
      where: { id },
      select: {
        logs: true,
        status: true,
      },
    });
  },

  findAll() {
    return prisma.deployment.findMany({
      include: deploymentInclude,
      orderBy: defaultOrder,
    });
  },

  findAllByProject(projectId: string) {
    return prisma.deployment.findMany({
      where: {
        projectId,
      },
      include: deploymentInclude,
      orderBy: defaultOrder,
    });
  },

  findAllByEnvironment(environmentId: string) {
    return prisma.deployment.findMany({
      where: {
        environmentId,
      },
      include: deploymentInclude,
      orderBy: defaultOrder,
    });
  },

  findById(id: string) {
    return prisma.deployment.findUnique({
      where: { id },
      include: deploymentInclude,
    });
  },

  findLatestSuccessful(projectId: string) {
    return prisma.deployment.findFirst({
      where: {
        projectId,
        status: DeploymentStatus.SUCCESS,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: deploymentInclude,
    });
  },

  findPreviousSuccessfulDeployment(
    projectId: string,
    currentDeploymentId: string
  ) {
    return prisma.deployment.findFirst({
      where: {
        projectId,

        status: DeploymentStatus.SUCCESS,

        id: {
          not: currentDeploymentId,
        },

        containerId: {
          not: null,
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        containerId: true,
      },
    });
  },

  findPreviousSuccessfulDeployments(
    projectId: string,
    currentDeploymentId: string
  ) {
    return prisma.deployment.findMany({
      where: {
        projectId,

        status: DeploymentStatus.SUCCESS,

        id: {
          not: currentDeploymentId,
        },

        containerId: {
          not: null,
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        containerId: true,
      },
    });
  },

  findActiveDeployment(projectId: string) {
    return prisma.deployment.findFirst({
      where: {
        projectId,

        status: DeploymentStatus.SUCCESS,

        isHealthy: true,
      },

      orderBy: {
        createdAt: "desc",
      },

      include: deploymentInclude,
    });
  },

  // ------------------------------------------------------------------
  // Write
  // ------------------------------------------------------------------

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

      include: deploymentInclude,
    });
  },

  update(
    id: string,
    data: UpdateDeploymentData
  ) {
    return prisma.deployment.update({
      where: {
        id,
      },

      data,

      include: deploymentInclude,
    });
  },

  updateLogs(
    id: string,
    logs: string
  ) {
    return prisma.deployment.update({
      where: {
        id,
      },

      data: {
        logs,
      },
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