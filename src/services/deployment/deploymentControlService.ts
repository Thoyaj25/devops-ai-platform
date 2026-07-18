import { deploymentRepository } from "@/repositories/deploymentRepository";
import { DockerDeploymentProvider } from "@/services/providers";

const provider = new DockerDeploymentProvider();

export const deploymentControlService = {

  async stop(deploymentId: string) {

    const deployment =
      await deploymentRepository.findById(deploymentId);

    if (!deployment?.containerId) {
      throw new Error(
        "Deployment container not found"
      );
    }

    await provider.stop(
      deployment.containerId
    );

    return {
      message: "Container stopped",
    };
  },


  async start(deploymentId: string) {

    const deployment =
      await deploymentRepository.findById(deploymentId);

    if (!deployment?.containerId) {
      throw new Error(
        "Deployment container not found"
      );
    }

    await provider.start(
      deployment.containerId
    );

    return {
      message: "Container started",
    };
  },


  async restart(deploymentId: string) {

    const deployment =
      await deploymentRepository.findById(deploymentId);

    if (!deployment?.containerId) {
      throw new Error(
        "Deployment container not found"
      );
    }

    await provider.restart(
      deployment.containerId
    );

    return {
      message: "Container restarted",
    };
  },


  async remove(deploymentId: string) {

    const deployment =
      await deploymentRepository.findById(deploymentId);

    if (!deployment?.containerId) {
      throw new Error(
        "Deployment container not found"
      );
    }

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
      message: "Container removed",
    };
  },


  async inspect(deploymentId: string) {

    const deployment =
      await deploymentRepository.findById(deploymentId);


    if (!deployment?.containerId) {
      throw new Error(
        "Deployment container not found"
      );
    }


    return provider.inspect(
      deployment.containerId
    );
  },
};