import {
  createPipelineSchema,
  type CreatePipelineInput,
} from "@/lib/validation/pipeline";

import { pipelineRepository } from "@/repositories/pipelineRepository";
import { projectRepository } from "@/repositories/projectRepository";
import { auditService } from "@/services/audit/auditService";

export const pipelineService = {
  /**
   * Returns all pipelines for a project.
   */
  async getProjectPipelines(projectId: string) {
    return pipelineRepository.findAllByProject(projectId);
  },

  /**
   * Returns a single pipeline.
   */
  async getPipeline(id: string) {
    const pipeline = await pipelineRepository.findById(id);

    if (!pipeline) {
      throw new Error("Pipeline not found");
    }

    return pipeline;
  },

  /**
   * Creates a pipeline after validating input
   * and verifying project ownership.
   */
  async createPipeline(
    input: CreatePipelineInput,
    ownerId: string
  ) {
    // Validate request payload
    const data = createPipelineSchema.parse(input);

    // Verify project ownership
    const project = await projectRepository.findByIdForOwner(
      data.projectId,
      ownerId
    );

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    // Create pipeline
    const pipeline = await pipelineRepository.create(data);

    // Audit
    await auditService.log({
      action: "CREATE_PIPELINE",
      resource: "PIPELINE",
      userId: ownerId,
      metadata: {
        name: pipeline.name,
        projectId: data.projectId,
        resourceId: pipeline.id,
      },
    });

    return pipeline;
  },
};