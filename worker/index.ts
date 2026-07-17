import { logger } from "@/lib/logger";
import { runDeploymentWorker } from "@/workers/deploymentWorker";

async function main() {
  logger.info("Starting deployment worker...");
  await runDeploymentWorker();
}

main().catch((error) => {
  logger.fatal(error, "Deployment worker crashed");
  process.exit(1);
});