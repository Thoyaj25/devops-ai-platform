import { JobStatus } from "@/generated/prisma";
import { deploymentJobService } from "./deploymentJobService";
import { DeploymentCancelledError } from "./errors/deploymentCancelledError";

export async function throwIfCancellationRequested(
  jobId: string
) {
  const job = await deploymentJobService.findById(jobId);

  if (!job) {
    throw new Error("Deployment job not found");
  }

  if (job.status === JobStatus.CANCEL_REQUESTED) {
    throw new DeploymentCancelledError();
  }
}