import { EnvironmentType } from "@/generated/prisma";
import { environmentRepository } from "@/repositories/environmentRepository";
import { projectRepository } from "@/repositories/projectRepository";
import { NotFoundError, ForbiddenError } from "@/lib/api/errors";

export const environmentService = {
  async getProjectEnvironments(projectId: string) {
    return environmentRepository.findAllByProject(projectId);
  },

  async getEnvironment(id: string) {
    return environmentRepository.findById(id);
  },

  async createEnvironment(
    input: {
      name: string;
      type: EnvironmentType;
      projectId: string;
    },
    ownerId: string
  ) {
    const project = await projectRepository.findByIdForOwner(
      input.projectId,
      ownerId
    );

    if (!project) {
      throw new NotFoundError("Project not found or unauthorized");
    }

    return environmentRepository.create({
      name: input.name,
      type: input.type,
      projectId: input.projectId,
    });
  },
};