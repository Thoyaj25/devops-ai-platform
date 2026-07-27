import { deploymentRepository } from "@/repositories/deploymentRepository";
import { DockerDeploymentProvider } from "@/services/providers";

export const deploymentGarbageCollector = {
  async collect() {
    const provider = new DockerDeploymentProvider();

    const deployments =
      await deploymentRepository.findGarbageDeployments();

    console.log(
      `[GarbageCollector] Found ${deployments.length} garbage deployments`
    );

    let existing = 0;
    let missing = 0;

    for (const deployment of deployments) {
      if (!deployment.containerId) {
        console.log(
          `[GarbageCollector] ${deployment.id}: no container recorded`
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

        console.log(
          `[GarbageCollector] ${deployment.id}: container missing`
        );

        await deploymentRepository.clearContainer(
          deployment.id
        );

        console.log(
          `[GarbageCollector] Cleared stale deployment metadata`
        );

        continue;
      }

      existing++;

      console.log(
        `[GarbageCollector] Removing container for ${deployment.id}`
      );

      try {
        await provider.stop(
          deployment.containerId
        );
      } catch {
        // Container may already be stopped.
      }

      await provider.remove(
        deployment.containerId
      );

      console.log(
        `[GarbageCollector] Removed ${deployment.containerId}`
      );

      await deploymentRepository.clearContainer(
        deployment.id
      );

      console.log(
        `[GarbageCollector] Cleared deployment runtime metadata`
      );
    }

    console.log("");

    console.log(
      `[GarbageCollector] Existing containers removed: ${existing}`
    );

    console.log(
      `[GarbageCollector] Missing containers cleaned: ${missing}`
    );
  },
};