import {
  createDeploymentSchema,
  type CreateDeploymentInput,
} from "@/lib/validation/deployment";

import { deploymentRepository } from "@/repositories/deploymentRepository";
import { environmentRepository } from "@/repositories/environmentRepository";
import { pipelineRepository } from "@/repositories/pipelineRepository";
import { projectRepository } from "@/repositories/projectRepository";
import { deploymentJobService } from "@/services/deployment/deploymentJobService";
import { auditService } from "@/services/audit/auditService";

export const deploymentService = {
  /**
   * Returns all deployments for an environment.
   */
  async getEnvironmentDeployments(environmentId: string) {
    return deploymentRepository.findAllByEnvironment(environmentId);
  },

  /**
   * Returns a deployment by ID.
   */
  async getDeployment(id: string) {
    const deployment = await deploymentRepository.findById(id);

    if (!deployment) {
      throw new Error("Deployment not found");
    }

    return deployment;
  },

  /**
   * Creates a deployment, records it, and initiates the deployment job.
   */
  async initiateDeployment(
    input: CreateDeploymentInput,
    ownerId: string
  ) {
    const deployment = await this.createDeployment(input, ownerId);
    
    // Create deployment job for async worker execution
    await deploymentJobService.createJob(deployment.id);

    return deployment;
  },

  /**
   * Creates a deployment after validating input,
   * verifying project ownership, and ensuring the
   * environment and pipeline belong to the project.
   */
  async createDeployment(
    input: CreateDeploymentInput,
    ownerId: string
  ) {
    // Validate request payload
    const data = createDeploymentSchema.parse(input);

    // Verify project ownership
    const project = await projectRepository.findByIdForOwner(
      data.projectId,
      ownerId
    );

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    // Verify environment exists
    const environment = await environmentRepository.findById(
      data.environmentId
    );

    if (!environment) {
      throw new Error("Environment not found");
    }

    // Verify environment belongs to project
    if (environment.projectId !== data.projectId) {
      throw new Error(
        "Environment does not belong to the specified project"
      );
    }

    // Verify pipeline exists
    const pipeline = await pipelineRepository.findById(
      data.pipelineId
    );

    if (!pipeline) {
      throw new Error("Pipeline not found");
    }

    // Verify pipeline belongs to project
    if (pipeline.projectId !== data.projectId) {
      throw new Error(
        "Pipeline does not belong to the specified project"
      );
    }

    // Create deployment
    const deployment = await deploymentRepository.create(data);

    // Audit
    await auditService.log({
      action: "CREATE_DEPLOYMENT",
      resource: "DEPLOYMENT",
      userId: ownerId,
      metadata: {
        version: deployment.version,
        projectId: data.projectId,
        environmentId: deployment.environmentId,
        pipelineId: deployment.pipelineId,
        resourceId: deployment.id,
      },
    });

    return deployment;
  },
};