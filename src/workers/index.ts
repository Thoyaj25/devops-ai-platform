import "dotenv/config";

import { runDeploymentWorker } from "./deploymentWorker";
import { logger } from "@/lib/logger";

async function main() {
  logger.info("Deployment worker service starting...");

  // Handle graceful shutdown signals
  const shutdown = async (signal: string) => {
    logger.info(`${signal} signal received: closing worker gracefully`);
    // The worker loop in runDeploymentWorker handles its own shutdown flag
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  try {
    await runDeploymentWorker();
    logger.info("Deployment worker stopped cleanly");
  } catch (error) {
    logger.error({ error }, "Worker crashed unexpectedly");
    process.exit(1);
  }
}

main();