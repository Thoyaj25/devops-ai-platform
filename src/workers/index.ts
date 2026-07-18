import "dotenv/config";

// Temporary log to verify environment variables
console.log({
  DOCKER_IMAGE: !!process.env.DOCKER_IMAGE,
  DOCKER_REGISTRY: !!process.env.DOCKER_REGISTRY,
  DATABASE_URL: !!process.env.DATABASE_URL,
});

import { runDeploymentWorker } from "./deploymentWorker";
import { logger } from "@/lib/logger";

async function main() {
  logger.info("Deployment worker service starting...");

  // The runDeploymentWorker function handles its own graceful shutdown
  // via the SIGINT/SIGTERM listeners inside it.
  try {
    await runDeploymentWorker();
    logger.info("Deployment worker stopped cleanly");
  } catch (error) {
    logger.error({ error }, "Worker crashed unexpectedly");
    process.exit(1);
  }
}

main();