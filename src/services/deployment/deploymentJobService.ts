import {
  JobStatus,
  Prisma,
} from "@/generated/prisma";

import { deploymentJobRepository } from "@/repositories/deploymentJobRepository";


type UpdateJobData =
  Prisma.DeploymentJobUpdateInput;



function requireId(id:string) {

  if (!id?.trim()) {
    throw new Error(
      "Job ID is required"
    );
  }

}



export const deploymentJobService = {



  async createJob(
    deploymentId:string
  ) {

    if (!deploymentId?.trim()) {

      throw new Error(
        "Deployment ID is required"
      );

    }


    return deploymentJobRepository.create(
      deploymentId
    );

  },




  async claimNextJob() {

    return deploymentJobRepository.claimNextJob();

  },




  async findById(
    id:string
  ) {

    requireId(id);

    return deploymentJobRepository.findById(
      id
    );

  },




  async updateJob(
    id:string,
    data:UpdateJobData
  ) {

    requireId(id);

    return deploymentJobRepository.update(
      id,
      data
    );

  },




  async markRunning(
    id:string
  ) {

    requireId(id);


    return deploymentJobRepository.update(
      id,
      {

        status:
          JobStatus.RUNNING,

        startedAt:
          new Date(),

        error:
          null,

      }
    );

  },




  async markCompleted(
    id:string
  ) {

    requireId(id);


    return deploymentJobRepository.update(
      id,
      {

        status:
          JobStatus.COMPLETED,

        completedAt:
          new Date(),

        error:
          null,

        nextRetryAt:
          null,

      }
    );

  },




  async incrementAttempts(
    id:string
  ) {

    requireId(id);

    return deploymentJobRepository.incrementAttempts(
      id
    );

  },




  async scheduleRetry(
    id:string,
    retryAt:Date
  ) {

    requireId(id);


    if (
      retryAt.getTime()
      <= Date.now()
    ) {

      throw new Error(
        "Retry time must be in the future"
      );

    }


    return deploymentJobRepository.scheduleRetry(
      id,
      retryAt
    );

  },




  async requeueJob(
    id:string
  ) {

    requireId(id);

    return deploymentJobRepository.requeue(
      id
    );

  },




  async markFailed(
    id:string,
    error?:string
  ) {

    requireId(id);


    return deploymentJobRepository.markFailed(
      id,
      error
    );

  },




  async failWithRetry(
    id:string,
    error:string,
    retrySeconds:number
  ) {


    requireId(id);



    await this.incrementAttempts(
      id
    );



    const job =
      await this.findById(
        id
      );



    if (!job) {

      throw new Error(
        "Deployment job not found"
      );

    }



    if (
      job.attempts < 3
    ) {


      const retryAt =
        new Date(
          Date.now()
          +
          retrySeconds * 1000
        );


      return this.scheduleRetry(
        id,
        retryAt
      );

    }



    return this.markFailed(
      id,
      error
    );

  },

};