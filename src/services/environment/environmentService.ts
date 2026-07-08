import { EnvironmentType } from "@/generated/prisma/enums";

import { createEnvironmentSchema } from "@/lib/validation/environment";

import { environmentRepository } from "@/repositories/environmentRepository";
import { projectRepository } from "@/repositories/projectRepository";

export const environmentService = {
  async getProjectEnvironments(projectId: string) {
    return environmentRepository.findAllByProject(projectId);
  },

  async getEnvironment(id: string) {
    const environment = await environmentRepository.findById(id);

    if (!environment) {
      return null;
    }

    return environment;
  },

  async createEnvironment(
    input: {
      name: string;
      type: EnvironmentType;
    },
    projectId: string,
    ownerId: string
  ) {
    const project = await projectRepository.findByIdForOwner(projectId, ownerId);

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    const data = createEnvironmentSchema.parse(input);

    return environmentRepository.create({
      ...data,
      projectId,
    });
  },
};
