import {
  type CreateProjectInput,
} from "@/lib/validation/project";

import { NotFoundError } from "@/lib/api/errors";

import { projectRepository } from "@/repositories/projectRepository";
import { auditService } from "@/services/audit/auditService";

export const projectService = {
  async getProjects() {
    return projectRepository.findAll();
  },

  async getProjectsByUserId(userId: string) {
    return projectRepository.findManyByOwner(userId);
  },

  async getProject(id: string) {
    const project = await projectRepository.findById(id);

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    return project;
  },

  async isUserAssociatedWithProject(
    userId: string,
    projectId: string
  ) {
    const project = await projectRepository.findByIdForOwner(
      projectId,
      userId
    );

    return project !== null;
  },

  async createProject(
    input: CreateProjectInput,
    ownerId: string
  ) {
    const project = await projectRepository.create({
      ...input,
      ownerId,
    });

    await auditService.log({
      action: "CREATE_PROJECT",
      resource: "PROJECT",
      userId: ownerId,
      metadata: {
        resourceId: project.id,
        name: project.name,
      },
    });

    return project;
  },
};