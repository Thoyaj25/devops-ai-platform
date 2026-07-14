import { NotFoundError } from "@/lib/api/errors";

import {
  type CreatePipelineInput,
} from "@/lib/validation/pipeline";

import { pipelineRepository } from "@/repositories/pipelineRepository";
import { projectRepository } from "@/repositories/projectRepository";

import { auditService } from "@/services/audit/auditService";

export const pipelineService = {
  async getProjectPipelines(projectId: string) {
    return pipelineRepository.findAllByProject(projectId);
  },

  async getPipeline(id: string) {
    const pipeline = await pipelineRepository.findById(id);

    if (!pipeline) {
      throw new NotFoundError("Pipeline not found");
    }

    return pipeline;
  },

  async createPipeline(
    input: CreatePipelineInput,
    ownerId: string
  ) {
    const project = await projectRepository.findByIdForOwner(
      input.projectId,
      ownerId
    );

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    const pipeline = await pipelineRepository.create(input);

    await auditService.log({
      action: "CREATE_PIPELINE",
      resource: "PIPELINE",
      userId: ownerId,
      metadata: {
        resourceId: pipeline.id,
        projectId: input.projectId,
        name: pipeline.name,
      },
    });

    return pipeline;
  },
};