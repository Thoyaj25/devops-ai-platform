import { JobStatus } from "@/generated/prisma";
import { logger } from "@/lib/logger";
import { deploymentExecutor } from "@/services/deployment/deploymentExecutor";
import { deploymentJobService } from "@/services/deployment/deploymentJobService";
import { workerHeartbeatService } from "@/services/worker/workerHeartbeatService";
import { DeploymentCancelledError } from "@/services/deployment/errors/deploymentCancelledError";

const WORKER_ID = "deployment-worker-1";
const HEARTBEAT_INTERVAL_MS = 10_000;
const IDLE_DELAY_MS = 5_000;
const MAX_RETRIES = 3;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function runDeploymentWorker(): Promise<void> {
  let shuttingDown = false;

  const shutdown = () => {
    if (!shuttingDown) {
      shuttingDown = true;
      logger.info({ workerId: WORKER_ID }, "Shutdown signal received");
    }
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  const heartbeatTimer = setInterval(async () => {
    try {
      await workerHeartbeatService.heartbeat(WORKER_ID);
    } catch (error) {
      logger.error(
        {
          workerId: WORKER_ID,
          error,
        },
        "Failed to update worker heartbeat"
      );
    }
  }, HEARTBEAT_INTERVAL_MS);

  logger.info(
    { workerId: WORKER_ID },
    "Deployment worker started"
  );

  try {
    while (!shuttingDown) {
      try {
        const job =
          await deploymentJobService.claimNextJob();

        if (!job) {
          await sleep(IDLE_DELAY_MS);
          continue;
        }

        logger.info(
          {
            workerId: WORKER_ID,
            jobId: job.id,
            deploymentId: job.deploymentId,
            attempt: job.attempts + 1,
          },
          "Processing deployment job"
        );

        

        try {
          await deploymentExecutor.execute(
  job.deploymentId,
  job.id
);

          await deploymentJobService.updateJob(job.id, {
            status: JobStatus.COMPLETED,
            completedAt: new Date(),
            error: null,
          });

          logger.info(
            {
              workerId: WORKER_ID,
              jobId: job.id,
            },
            "Deployment completed successfully"
          );
        } catch (error) {
          if (error instanceof DeploymentCancelledError) {
  await deploymentJobService.updateJob(
    job.id,
    {
      status: JobStatus.CANCELLED,
      completedAt: new Date(),
      error: "Cancelled by user",
    }
  );

  logger.info(
    {
      workerId: WORKER_ID,
      jobId: job.id,
    },
    "Deployment job cancelled"
  );

  continue;
}
          await deploymentJobService.incrementAttempts(
            job.id
          );

          const updatedJob =
            await deploymentJobService.findById(job.id);

          const attempts =
            updatedJob?.attempts ?? 1;

          const errorMessage =
            error instanceof Error
              ? error.message
              : String(error);

          logger.error(
            {
              workerId: WORKER_ID,
              jobId: job.id,
              deploymentId: job.deploymentId,
              attempts,
              error,
            },
            "Deployment execution failed"
          );

          if (attempts < MAX_RETRIES) {
            const retryDelaySeconds =
              Math.pow(2, attempts) * 10;

            const nextRetryAt = new Date(
              Date.now() + retryDelaySeconds * 1000
            );

            await deploymentJobService.scheduleRetry(
              job.id,
              nextRetryAt
            );

            logger.info(
              {
                workerId: WORKER_ID,
                jobId: job.id,
                retryAt: nextRetryAt,
              },
              "Deployment scheduled for retry"
            );
          } else {
            await deploymentJobService.updateJob(job.id, {
              status: JobStatus.FAILED,
              completedAt: new Date(),
              error: errorMessage,
            });

            logger.error(
              {
                workerId: WORKER_ID,
                jobId: job.id,
              },
              "Deployment permanently failed"
            );
          }
        }
      } catch (error) {
        logger.error(
          {
            workerId: WORKER_ID,
            error,
          },
          "Unexpected worker loop failure"
        );

        await sleep(IDLE_DELAY_MS);
      }
    }
  } finally {
    clearInterval(heartbeatTimer);

    process.removeListener("SIGINT", shutdown);
    process.removeListener("SIGTERM", shutdown);

    logger.info(
      { workerId: WORKER_ID },
      "Deployment worker stopped"
    );
  }
}