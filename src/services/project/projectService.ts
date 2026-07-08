import {
  createProjectSchema,
  type CreateProjectInput,
} from "@/lib/validation/project";
import { projectRepository } from "@/repositories/projectRepository";

export const projectService = {
  async getProjects() {
    return projectRepository.findAll();
  },

  async getProject(id: string) {
    const project = await projectRepository.findById(id);

    if (!project) {
      throw new Error("Project not found");
    }

    return project;
  },

  async createProject(
    input: CreateProjectInput,
    ownerId: string
  ) {
    const data = createProjectSchema.parse(input);

    return projectRepository.create({
      ...data,
      ownerId,
    });
  },
};