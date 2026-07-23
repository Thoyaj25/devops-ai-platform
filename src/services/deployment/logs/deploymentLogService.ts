import { prisma } from "@/lib/prisma";

const deploymentQueues = new Map<
  string,
  Promise<void>
>();

const MAX_LOG_LENGTH = 5000;


function normalizeMessage(
  message: string
) {
  return message
    .trim()
    .slice(0, MAX_LOG_LENGTH);
}


export const deploymentLogService = {


  async append(
    deploymentId: string,
    message: string,
    stage?: string
  ): Promise<void> {


    if (!message.trim()) {
      return;
    }


    const previous =
      deploymentQueues.get(deploymentId) ??
      Promise.resolve();



    const current =
      previous.then(async () => {

        await prisma.deploymentLog.create({
          data: {
            deploymentId,

            stage:
              stage ?? null,

            message:
              normalizeMessage(message),
          },
        });

      });



    const safeQueue =
      current.catch((error) => {

        console.error(
          "Deployment log write failed",
          {
            deploymentId,
            error,
          }
        );

      });



    deploymentQueues.set(
      deploymentId,
      safeQueue
    );



    try {

      await current;

    }
    finally {

      if (
        deploymentQueues.get(
          deploymentId
        ) === safeQueue
      ) {

        deploymentQueues.delete(
          deploymentId
        );

      }

    }

  },



  async getLogs(
    deploymentId: string
  ) {

    return prisma.deploymentLog.findMany({

      where:{
        deploymentId,
      },


      orderBy:{
        createdAt:"asc",
      },


      select:{
        id:true,
        stage:true,
        message:true,
        createdAt:true,
      },

    });

  },



  async clearLogs(
    deploymentId:string
  ){

    return prisma.deploymentLog.deleteMany({

      where:{
        deploymentId,
      },

    });

  },


};