import { JobStatus } from "@/generated/prisma";

import { deploymentJobRepository } from "@/repositories/deploymentJobRepository";

import { DeploymentCancelledError } from "./errors/deploymentCancelledError";


export async function checkDeploymentCancellation(
  jobId: string
) {
  const job =
    await deploymentJobRepository.findById(
      jobId
    );

  if (
    job?.status === JobStatus.CANCEL_REQUESTED
  ) {
    throw new DeploymentCancelledError();
  }
}