import { DeploymentStatus } from "@/generated/prisma";
import { deploymentRepository } from "@/repositories/deploymentRepository";
import { deploymentLogService } from "./logs/deploymentLogService";

type PreviousDeployment = {
  id: string;
  containerId: string | null;
} | null;

export const deploymentCleanupService = {
  async cleanupPreviousDeployment(
    deployment: PreviousDeployment
  ): Promise<void> {
    if (!deployment) {
      console.info(
        "[Cleanup] No previous successful deployment found."
      );
      return;
    }

    try {
      console.info("[Cleanup] Preserving rollback candidate", {
        deploymentId: deployment.id,
        containerId: deployment.containerId,
      });

      await deploymentRepository.update(deployment.id, {
        status: DeploymentStatus.SUPERSEDED,
        isHealthy: false,
      });

      await deploymentLogService.append(
        deployment.id,
        "Deployment superseded by a newer successful deployment. Preserved for rollback."
      );

      console.info(
        `[Cleanup] Deployment ${deployment.id} marked as SUPERSEDED.`
      );
    } catch (error) {
      console.error(
        `[Cleanup] Failed to supersede deployment ${deployment.id}`,
        error
      );

      // Never fail the new deployment because cleanup failed.
    }
  },
};