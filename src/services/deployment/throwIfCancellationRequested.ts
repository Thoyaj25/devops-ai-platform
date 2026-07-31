import {
  JobStatus,
  DeploymentStatus,
} from "@/generated/prisma";
import { deploymentJobService } from "./deploymentJobService";
import { deploymentService } from "./deploymentService";
import { DeploymentCancelledError } from "./errors/deploymentCancelledError";

export async function throwIfCancellationRequested(
  jobId: string
) {
  const job = await deploymentJobService.findById(jobId);

  if (!job) {
    throw new Error("Deployment job not found");
  }

  if (job.status === JobStatus.CANCEL_REQUESTED) {
    await deploymentJobService.markCancelled(jobId);
    await deploymentService.updateStatus(
      job.deploymentId,
      DeploymentStatus.CANCELLED
    );

    throw new DeploymentCancelledError();
  }
}