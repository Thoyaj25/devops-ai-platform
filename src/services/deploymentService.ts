import { DeploymentStatus } from "@/generated/prisma/enums";

import { deploymentRepository } from "@/repositories/deploymentRepository";
import { projectRepository } from "@/repositories/projectRepository";
import { environmentRepository } from "@/repositories/environmentRepository";
import { pipelineRepository } from "@/repositories/pipelineRepository";

export const deploymentService = {
  async getDeployment(id: string) {
    const deployment = await deploymentRepository.findById(id);

    if (!deployment) {
      throw new Error("Deployment not found");
    }

    return deployment;
  },

  async getProjectDeployments(projectId: string) {
    return deploymentRepository.findAllByProject(projectId);
  },

  async getEnvironmentDeployments(environmentId: string) {
    return deploymentRepository.findAllByEnvironment(environmentId);
  },

  async getPipelineDeployments(pipelineId: string) {
    return deploymentRepository.findAllByPipeline(pipelineId);
  },

  async createDeployment(data: {
    projectId: string;
    environmentId: string;
    pipelineId: string;
    version?: string;
  }) {
    const project = await projectRepository.findById(data.projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    const environment = await environmentRepository.findById(
      data.environmentId
    );

    if (!environment) {
      throw new Error("Environment not found");
    }

    const pipeline = await pipelineRepository.findById(
      data.pipelineId
    );

    if (!pipeline) {
      throw new Error("Pipeline not found");
    }

    return deploymentRepository.create({
      projectId: data.projectId,
      environmentId: data.environmentId,
      pipelineId: data.pipelineId,
      version: data.version,
      status: DeploymentStatus.RUNNING,
    });
  },

  async updateDeploymentStatus(
    id: string,
    status: DeploymentStatus,
    logs?: string
  ) {
    const deployment = await deploymentRepository.findById(id);

    if (!deployment) {
      throw new Error("Deployment not found");
    }

    return deploymentRepository.updateStatus(
      id,
      status,
      logs
    );
  },

  async deleteDeployment(id: string) {
    const deployment = await deploymentRepository.findById(id);

    if (!deployment) {
      throw new Error("Deployment not found");
    }

    return deploymentRepository.delete(id);
  },
};