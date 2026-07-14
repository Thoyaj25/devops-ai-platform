import { NotFoundError, BadRequestError } from "@/lib/api/errors";

import {
  type CreateDeploymentInput,
} from "@/lib/validation/deployment";

import { deploymentRepository } from "@/repositories/deploymentRepository";
import { environmentRepository } from "@/repositories/environmentRepository";
import { pipelineRepository } from "@/repositories/pipelineRepository";
import { projectRepository } from "@/repositories/projectRepository";

import { deploymentJobService } from "@/services/deployment/deploymentJobService";
import { auditService } from "@/services/audit/auditService";

export const deploymentService = {
  async getEnvironmentDeployments(environmentId: string) {
    return deploymentRepository.findAllByEnvironment(environmentId);
  },

  async getProjectDeployments(projectId: string) {
    return deploymentRepository.findAllByProject(projectId);
  },

  async getDeployment(id: string) {
    const deployment = await deploymentRepository.findById(id);

    if (!deployment) {
      throw new NotFoundError("Deployment not found");
    }

    return deployment;
  },

  async initiateDeployment(
    input: CreateDeploymentInput,
    ownerId: string
  ) {
    const deployment = await this.createDeployment(input, ownerId);

    await deploymentJobService.createJob(deployment.id);

    return deployment;
  },

  async createDeployment(
    input: CreateDeploymentInput,
    ownerId: string
  ) {
    const project = await projectRepository.findByIdForOwner(
      input.projectId,
      ownerId
    );

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    const environment = await environmentRepository.findById(
      input.environmentId
    );

    if (!environment) {
      throw new NotFoundError("Environment not found");
    }

    if (environment.projectId !== input.projectId) {
      throw new BadRequestError(
        "Environment does not belong to the specified project"
      );
    }

    const pipeline = await pipelineRepository.findById(
      input.pipelineId
    );

    if (!pipeline) {
      throw new NotFoundError("Pipeline not found");
    }

    if (pipeline.projectId !== input.projectId) {
      throw new BadRequestError(
        "Pipeline does not belong to the specified project"
      );
    }

    const deployment = await deploymentRepository.create(input);

    await auditService.log({
      action: "CREATE_DEPLOYMENT",
      resource: "DEPLOYMENT",
      userId: ownerId,
      metadata: {
        resourceId: deployment.id,
        version: deployment.version,
        projectId: input.projectId,
        environmentId: deployment.environmentId,
        pipelineId: deployment.pipelineId,
      },
    });

    return deployment;
  },
};