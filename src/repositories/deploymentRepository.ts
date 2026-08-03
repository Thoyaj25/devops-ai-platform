import {
  Prisma,
  DeploymentStatus,
} from "@/generated/prisma";

import { prisma } from "@/lib/prisma";


const deploymentInclude =
  Prisma.validator<Prisma.DeploymentInclude>()({

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

  });


const defaultOrder:
  Prisma.DeploymentOrderByWithRelationInput = {
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


  // ======================================================
  // READ
  // ======================================================


  count() {

    return prisma.deployment.count();

  },


  exists(id:string) {

    return prisma.deployment.findUnique({

      where:{
        id,
      },

      select:{
        id:true,
      },

    });

  },


  findById(id:string) {

    return prisma.deployment.findUnique({

      where:{
        id,
      },

      include:
        deploymentInclude,

    });

  },


  findAll() {

    return prisma.deployment.findMany({

      include:
        deploymentInclude,

      orderBy:
        defaultOrder,

    });

  },


  findAllByProject(
    projectId:string
  ) {

    return prisma.deployment.findMany({

      where:{
        projectId,
      },

      include:
        deploymentInclude,

      orderBy:
        defaultOrder,

    });

  },


  findAllByEnvironment(
    environmentId:string
  ) {

    return prisma.deployment.findMany({

      where:{
        environmentId,
      },

      include:
        deploymentInclude,

      orderBy:
        defaultOrder,

    });

  },


  findLogs(id:string) {

    return prisma.deployment.findUnique({

      where:{
        id,
      },

      select:{
        logs:true,
        status:true,
      },

    });

  },


  /**
   * Find all successful deployments
   * Used for cleanup and reconciliation
   */
  findSuccessfulDeployments(
    projectId?:string
  ) {

    return prisma.deployment.findMany({

      where:{

        ...(projectId && {
          projectId,
        }),

        status: {
  in: [
    DeploymentStatus.SUCCESS,
    DeploymentStatus.SUPERSEDED,
  ],
},

        containerId:{
          not:null,
        },

      },


      orderBy:{
        createdAt:"desc",
      },


      select:{

        id:true,

        projectId:true,

        containerId:true,

        hostPort:true,

        containerUrl:true,

        isHealthy:true,

        createdAt:true,

      },

    });

  },


  /**
   * Current production deployment
   */
  findActiveDeployment(
    projectId:string
  ) {

    return prisma.deployment.findFirst({

      where:{

        projectId,

        status:
          DeploymentStatus.SUCCESS,

        isHealthy:true,

      },


      orderBy:{
        createdAt:"desc",
      },


      include:
        deploymentInclude,

    });

  },


  /**
   * Latest successful deployment
   */
  findLatestSuccessful(
    projectId:string
  ) {

    return prisma.deployment.findFirst({

      where:{

        projectId,

        status:
          DeploymentStatus.SUCCESS,

      },


      orderBy:{
        createdAt:"desc",
      },


      include:
        deploymentInclude,

    });

  },


  /**
 * Previous deployment kept for rollback.
 *
 * We allow both SUCCESS and SUPERSEDED deployments,
 * but only if the deployment container still exists.
 */
findPreviousSuccessfulDeployment(
  projectId: string,
  currentDeploymentId: string
) {
  return prisma.deployment.findFirst({
    where: {
      projectId,

      id: {
        not: currentDeploymentId,
      },

      status: {
        in: [
          DeploymentStatus.SUCCESS,
          DeploymentStatus.SUPERSEDED,
        ],
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


  /**
   * Deployments exceeding retention policy
   */
  findDeploymentsForCleanup(
    projectId:string,
    keep:number = 2
  ) {

    return prisma.deployment.findMany({

      where:{

        projectId,

        status:
          DeploymentStatus.SUCCESS,

        containerId:{
          not:null,
        },

      },


      orderBy:{
        createdAt:"desc",
      },


      skip:keep,


      select:{

        id:true,

        containerId:true,

        hostPort:true,

        containerUrl:true,

      },

    });

  },


  /**
   * Containers safe for garbage collection
   */
  findGarbageDeployments(
    projectId?:string
  ) {

    return prisma.deployment.findMany({

      where:{

        ...(projectId && {
          projectId,
        }),


        status:{
  in:[

    DeploymentStatus.FAILED,

    DeploymentStatus.SUPERSEDED,

    DeploymentStatus.ROLLED_BACK,

    DeploymentStatus.CANCELLED,

  ],
},


        containerId:{
          not:null,
        },

      },


      orderBy:{
        createdAt:"asc",
      },


      select:{

        id:true,

        containerId:true,

        hostPort:true,

        status:true,

      },

    });

  },



  // ======================================================
  // WRITE
  // ======================================================


  create(
    data:CreateDeploymentData
  ) {

    return prisma.deployment.create({

      data:{

        version:
          data.version,


        project:{
          connect:{
            id:
              data.projectId,
          },
        },


        environment:{
          connect:{
            id:
              data.environmentId,
          },
        },


        pipeline:{
          connect:{
            id:
              data.pipelineId,
          },
        },

      },


      include:
        deploymentInclude,

    });

  },


  update(
    id:string,
    data:UpdateDeploymentData
  ) {

    return prisma.deployment.update({

      where:{
        id,
      },


      data,


      include:
        deploymentInclude,

    });

  },


  updateLogs(
    id:string,
    logs:string
  ) {

    return prisma.deployment.update({

      where:{
        id,
      },


      data:{
        logs,
      },

    });

  },


  clearContainer(
    id:string
  ) {

    return prisma.deployment.update({

      where:{
        id,
      },


      data:{

        containerId:null,

        containerUrl:null,

        hostPort:null,

        isHealthy:false,

      },

    });

  },


  delete(
    id:string
  ) {

    return prisma.deployment.delete({

      where:{
        id,
      },

    });

  },


};