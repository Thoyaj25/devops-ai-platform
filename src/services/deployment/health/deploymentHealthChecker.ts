
const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export class DeploymentHealthChecker {
  async check(containerName: string): Promise<boolean> {
    const maxAttempts = 30;
    const delayMs = 1000;
    const url = `http://${containerName}:3000/api/health`;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
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
            error instanceof Error ? error.message : String(error)
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