import { pipelineRepository } from "@/repositories/pipelineRepository";
import { projectRepository } from "@/repositories/projectRepository";

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

    return pipelineRepository.create(input);
  },
};
