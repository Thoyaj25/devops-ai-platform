import { deploymentRepository } from "@/repositories/deploymentRepository";
import { environmentRepository } from "@/repositories/environmentRepository";

export const deploymentService = {
  async getEnvironmentDeployments(
    environmentId: string
  ) {
    return deploymentRepository.findAllByEnvironment(
      environmentId
    );
  },

  async getDeployment(id: string) {
    const deployment =
      await deploymentRepository.findById(id);

    if (!deployment) {
      throw new Error("Deployment not found");
    }

    return deployment;
  },

  async createDeployment(input: {
    version?: string;
    projectId: string;
    environmentId: string;
    pipelineId: string;
  }) {
    const environment =
      await environmentRepository.findById(
        input.environmentId
      );

    if (!environment) {
      throw new Error("Environment not found");
    }

    if (environment.projectId !== input.projectId) {
      throw new Error(
        "Environment does not belong to the specified project"
      );
    }

    return deploymentRepository.create(input);
  },
};