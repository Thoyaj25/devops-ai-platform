import { JobStatus } from "@/generated/prisma";
import { deploymentJobRepository } from "@/repositories/deploymentJobRepository";
import { DeploymentCancelledError } from "@/services/deployment/errors/deploymentCancelledError";
import { HealthCheckConfig } from "./healthCheckConfig";

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export class DeploymentHealthChecker {
  async check(
    containerName: string,
    config: HealthCheckConfig,
    jobId?: string
  ): Promise<boolean> {
    const delayMs = 1000;
    const maxAttempts = Math.ceil((config.startupTimeout * 1000) / delayMs);
    const url = `http://${containerName}:${config.port}${config.path}`;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      //
      // Check for cancellation before every health check
      //
      if (jobId) {
        const job =
          await deploymentJobRepository.findById(jobId);

        if (job?.status === JobStatus.CANCEL_REQUESTED) {
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

      await sleep(delayMs);
    }

    throw new Error(
      `Deployment '${containerName}' failed health checks after ${maxAttempts} attempts.`
    );
  }
}

export const deploymentHealthChecker =
  new DeploymentHealthChecker();