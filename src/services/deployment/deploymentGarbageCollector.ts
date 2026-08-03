import { deploymentRepository } from "@/repositories/deploymentRepository";
import { DockerDeploymentProvider } from "@/services/providers";
import { logger } from "@/lib/logger";

export const deploymentGarbageCollector = {
  async collect() {
    const provider = new DockerDeploymentProvider();

    const deployments =
      await deploymentRepository.findGarbageDeployments();

    logger.info(
      {
        count: deployments.length,
      },
      "Garbage collector found deployments"
    );

    let existing = 0;
    let missing = 0;

    for (const deployment of deployments) {
      if (!deployment.containerId) {
        logger.info(
          {
            deploymentId: deployment.id,
          },
          "Garbage collector found deployment without container"
        );

        continue;
      }

      const exists = await provider.containerExists(
        deployment.containerId
      );

      /**
       * Container already removed outside the garbage collector.
       * Clean stale runtime metadata from the database.
       */
      if (!exists) {
        missing++;

        logger.info(
          {
            deploymentId: deployment.id,
          },
          "Container missing. Clearing stale metadata"
        );

        await deploymentRepository.clearContainer(
          deployment.id
        );

        logger.info(
          {
            deploymentId: deployment.id,
          },
          "Cleared stale deployment metadata"
        );

        continue;
      }

      existing++;

      logger.info(
        {
          deploymentId: deployment.id,
          containerId: deployment.containerId,
        },
        "Removing garbage deployment container"
      );

      try {
        await provider.stop(
          deployment.containerId
        );
      } catch {
        // Container may already be stopped.
      }

      try {
        await provider.remove(
          deployment.containerId
        );

        logger.info(
          {
            containerId: deployment.containerId,
          },
          "Removed deployment container"
        );
      } catch (error) {
        logger.error(
          {
            containerId: deployment.containerId,
            error,
          },
          "Failed removing deployment container"
        );

        continue;
      }

      await deploymentRepository.clearContainer(
        deployment.id
      );

      logger.info(
        {
          deploymentId: deployment.id,
        },
        "Cleared deployment runtime metadata"
      );
    }

    logger.info(
      {
        existingRemoved: existing,
        missingCleaned: missing,
      },
      "Garbage collector completed"
    );
  },
};