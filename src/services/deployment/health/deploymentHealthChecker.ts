import { JobStatus } from "@/generated/prisma";
import { deploymentJobRepository } from "@/repositories/deploymentJobRepository";
import { DeploymentCancelledError } from "@/services/deployment/errors/deploymentCancelledError";

const sleep = (ms: number) =>
  new Promise((resolve) =>
    setTimeout(resolve, ms)
  );


const sleepWithCancellationCheck = async (
  ms: number,
  jobId?: string
) => {

  const interval = 250;
  let elapsed = 0;


  while (elapsed < ms) {

    if (jobId) {

      const job =
        await deploymentJobRepository.findById(jobId);


      if (
        job?.status === JobStatus.CANCEL_REQUESTED ||
        job?.status === JobStatus.CANCELLED
      ) {

        throw new DeploymentCancelledError();

      }

    }


    await sleep(interval);

    elapsed += interval;
  }
};

export class DeploymentHealthChecker {
  async check(
    containerName: string,
    jobId?: string
  ): Promise<boolean> {
    const maxAttempts = 30;
    const delayMs = 1000;
    const url = `http://${containerName}:3000/api/health`;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {

  if (jobId) {

    const job =
      await deploymentJobRepository.findById(jobId);


    if (
      job?.status === JobStatus.CANCEL_REQUESTED ||
      job?.status === JobStatus.CANCELLED
    ) {

      console.log(
        `[HealthCheck] Deployment cancelled during health check`
      );

      throw new DeploymentCancelledError();
    }
  }
      try {
        const response = await fetch(url);

        if (response.ok) {
          console.log(
            `[HealthCheck] ${containerName} is healthy after ${attempt} attempt(s).`
          );
          return true;
        }

        console.log(
          `[HealthCheck] Attempt ${attempt}: HTTP ${response.status}`
        );
      } catch (error) {
        console.log(
          `[HealthCheck] Attempt ${attempt}: ${
            error instanceof Error
              ? error.message
              : String(error)
          }`
        );
      }

      await sleepWithCancellationCheck(
  delayMs,
  jobId
);
    }

    throw new Error(
      `Deployment '${containerName}' failed health checks after ${maxAttempts} attempts.`
    );
  }
}

export const deploymentHealthChecker =
  new DeploymentHealthChecker();