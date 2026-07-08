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
      throw new Error("Pipeline not found");
    }

    return pipeline;
  },

  async createPipeline(
    input: {
      name: string;
      provider?: string;
      repository?: string;
      projectId: string;
    },
    ownerId: string
  ) {
    const project = await projectRepository.findByIdForOwner(input.projectId, ownerId);

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    const pipeline = await pipelineRepository.create(input);

    await auditService.log({
      action: "CREATE_PIPELINE",
      resource: "PIPELINE",
      userId: ownerId,
      metadata: { name: pipeline.name, projectId: input.projectId, resourceId: pipeline.id },
    });

    return pipeline;
  },
};