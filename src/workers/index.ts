import "dotenv/config";

import { workerEnv } from "@/lib/workerEnv";
import { runDeploymentWorker } from "./deploymentWorker";
import { reconciliationService } from "@/services/deployment/reconciliationService";
import { logger } from "@/lib/logger";

logger.info(
  {
    nodeEnv: workerEnv.NODE_ENV,
    databaseConfigured: true,
  },
  "Worker environment validated"
);

async function main() {
  logger.info("Deployment worker service starting...");

  try {
    if (process.env.WORKER_RECONCILIATION_ENABLED === "true") {
      logger.info("Running deployment reconciliation...");
      await reconciliationService.reconcile();
    } else {
      logger.info(
        "Deployment reconciliation disabled for this worker"
      );
    }

    await runDeploymentWorker();

    logger.info("Deployment worker stopped cleanly");
  } catch (error) {
    logger.error(
      { error },
      "Worker crashed unexpectedly"
    );

    process.exit(1);
  }
}

main();
