import { deploymentRepository } from "@/repositories/deploymentRepository";
import { environmentRepository } from "@/repositories/environmentRepository";
import { pipelineRepository } from "@/repositories/pipelineRepository";
import { projectRepository } from "@/repositories/projectRepository";

export const deploymentService = {
  async getEnvironmentDeployments(environmentId: string) {
    return deploymentRepository.findAllByEnvironment(environmentId);
  },

  async getDeployment(id: string) {
    const deployment = await deploymentRepository.findById(id);

    if (!deployment) {
      throw new Error("Deployment not found");
    }

    return deployment;
  },

  async createDeployment(
    input: {
      version?: string;
      projectId: string;
      environmentId: string;
      pipelineId: string;
    },
    ownerId: string
  ) {
    const project = await projectRepository.findByIdForOwner(input.projectId, ownerId);

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    const environment = await environmentRepository.findById(input.environmentId);

    if (!environment) {
      throw new Error("Environment not found");
    }

    if (environment.projectId !== input.projectId) {
      throw new Error("Environment does not belong to the specified project");
    }

    const pipeline = await pipelineRepository.findById(input.pipelineId);

    if (!pipeline) {
      throw new Error("Pipeline not found");
    }

    if (pipeline.projectId !== input.projectId) {
      throw new Error("Pipeline does not belong to the specified project");
    }

    return deploymentRepository.create(input);
  },
};
