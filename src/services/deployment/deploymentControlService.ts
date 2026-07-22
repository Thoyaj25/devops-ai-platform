import { deploymentRepository } from "@/repositories/deploymentRepository";
import { DockerDeploymentProvider } from "@/services/providers";

const provider = new DockerDeploymentProvider();

type DeploymentWithContainer = {
  id: string;
  containerId: string;
};

async function getDeploymentContainer(
  deploymentId: string
): Promise<DeploymentWithContainer> {
  const deployment = await deploymentRepository.findById(deploymentId);

  if (!deployment) {
    throw new Error(
      `Deployment '${deploymentId}' not found`
    );
  }

  if (!deployment.containerId) {
    throw new Error(
      `Deployment '${deploymentId}' has no running container`
    );
  }

  return {
    id: deployment.id,
    containerId: deployment.containerId,
  };
}

export const deploymentControlService = {
  async start(deploymentId: string) {
    const deployment =
      await getDeploymentContainer(deploymentId);

    await provider.start(
      deployment.containerId
    );

    return {
      message: "Container started successfully",
      containerId: deployment.containerId,
    };
  },

  async stop(deploymentId: string) {
    const deployment =
      await getDeploymentContainer(deploymentId);

    await provider.stop(
      deployment.containerId
    );

    return {
      message: "Container stopped successfully",
      containerId: deployment.containerId,
    };
  },

  async restart(deploymentId: string) {
    const deployment =
      await getDeploymentContainer(deploymentId);

    await provider.restart(
      deployment.containerId
    );

    return {
      message: "Container restarted successfully",
      containerId: deployment.containerId,
    };
  },

  async remove(deploymentId: string) {
    const deployment =
      await getDeploymentContainer(deploymentId);

    await provider.remove(
      deployment.containerId
    );

    await deploymentRepository.update(
      deploymentId,
      {
        containerId: null,
        hostPort: null,
        containerUrl: null,
        isHealthy: false,
      }
    );

    return {
      message: "Container removed successfully",
      deploymentId,
    };
  },

  async inspect(deploymentId: string) {
    const deployment =
      await getDeploymentContainer(deploymentId);

    return provider.inspect(
      deployment.containerId
    );
  },
};