import { logger } from "@/lib/logger";
import { runDeploymentWorker } from "@/workers/deploymentWorker";

async function main(): Promise<void> {
  logger.info("Deployment worker started");

  await runDeploymentWorker();

  logger.info("Deployment worker stopped");
}

main().catch((error) => {
  logger.error(
    {
      error,
    },
    "Worker crashed"
  );

  process.exit(1);
});