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

  async createPipeline(input: {
    name: string;
    provider?: string;
    repository?: string;
    projectId: string;
  }) {
    const project = await projectRepository.findById(
      input.projectId
    );

    if (!project) {
      throw new Error("Project not found");
    }

    return pipelineRepository.create(input);
  },
};