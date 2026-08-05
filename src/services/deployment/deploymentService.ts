import {
  BadRequestError,
  NotFoundError,
} from "@/lib/api/errors";

import {
  CreateDeploymentInput,
} from "@/lib/validation/deployment";

import {
  DeploymentStatus,
} from "@/generated/prisma";

import { auditService } from "@/services/audit/auditService";
import { deploymentJobService } from "@/services/deployment/deploymentJobService";

import { deploymentRepository } from "@/repositories/deploymentRepository";
import { environmentRepository } from "@/repositories/environmentRepository";
import { pipelineRepository } from "@/repositories/pipelineRepository";
import { projectRepository } from "@/repositories/projectRepository";

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

  async updateStatus(
    id: string,
    status: DeploymentStatus
  ) {
    return deploymentRepository.update(id, {
      status,
    });
  },

  async getPreviousRollbackTarget(
    deploymentId: string
  ) {
    const deployment =
      await deploymentRepository.findById(deploymentId);

    if (!deployment) {
      throw new NotFoundError("Deployment not found");
    }

    return deploymentRepository.findPreviousSuccessfulDeployment(
      deployment.projectId,
      deploymentId
    );
  },

  /**
   * Validate every dependency before
   * creating Deployment or DeploymentJob.
   */
  async validateDeploymentPrerequisites(
    input: CreateDeploymentInput,
    ownerId: string
  ) {
    const project =
      await projectRepository.findByIdForOwner(
        input.projectId,
        ownerId
      );

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    const environment =
      await environmentRepository.findById(
        input.environmentId
      );

    if (!environment) {
      throw new NotFoundError("Environment not found");
    }

    if (environment.projectId !== project.id) {
      throw new BadRequestError(
        "Environment does not belong to project"
      );
    }

    const pipeline =
      await pipelineRepository.findById(
        input.pipelineId
      );

    if (!pipeline) {
      throw new NotFoundError("Pipeline not found");
    }

    if (pipeline.projectId !== project.id) {
      throw new BadRequestError(
        "Pipeline does not belong to project"
      );
    }

    //
    // NEW VALIDATION
    //
    if (
      !pipeline.repository ||
      pipeline.repository.trim().length === 0
    ) {
      throw new BadRequestError(
        "Pipeline repository is not configured"
      );
    }

    if (
      !pipeline.branch ||
      pipeline.branch.trim().length === 0
    ) {
      throw new BadRequestError(
        "Pipeline branch is not configured"
      );
    }

    return {
      project,
      environment,
      pipeline,
    };
  },

  async initiateDeployment(
    input: CreateDeploymentInput,
    ownerId: string
  ) {
    await this.validateDeploymentPrerequisites(
      input,
      ownerId
    );

    const deployment =
      await deploymentRepository.create({
        ...input,
      });

    try {
      await deploymentJobService.createJob(
        deployment.id
      );

      await auditService.log({
        action: "DEPLOYMENT_QUEUED",
        resource: "DEPLOYMENT",
        userId: ownerId,
        metadata: {
          resourceId: deployment.id,
          status: deployment.status,
        },
      });

      return deployment;
    } catch (error) {
      await deploymentRepository.update(
        deployment.id,
        {
          status: DeploymentStatus.FAILED,
        }
      );

      throw error;
    }
  },

  async createDeployment(
    input: CreateDeploymentInput,
    ownerId: string
  ) {
    await this.validateDeploymentPrerequisites(
      input,
      ownerId
    );

    return deploymentRepository.create({
      ...input,
    });
  },
};