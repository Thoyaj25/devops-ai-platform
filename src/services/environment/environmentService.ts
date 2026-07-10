import { EnvironmentType } from "@/generated/prisma"; // Use your generated client
import { createEnvironmentSchema } from "@/lib/validation/environment";
import { environmentRepository } from "@/repositories/environmentRepository";
import { projectRepository } from "@/repositories/projectRepository";

export const environmentService = {
  /**
   * Fetch all environments for a specific project
   */
  async getProjectEnvironments(projectId: string) {
    return environmentRepository.findAllByProject(projectId);
  },

  /**
   * Fetch a single environment by ID
   */
  async getEnvironment(id: string) {
    const environment = await environmentRepository.findById(id);
    return environment || null;
  },

  /**
   * Create a new environment with project ownership validation
   */
  async createEnvironment(
    input: { name: string; type: EnvironmentType },
    projectId: string,
    ownerId: string
  ) {
    // 1. Verify project ownership/existence
    const project = await projectRepository.findByIdForOwner(projectId, ownerId);
    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    // 2. Validate input using Zod schema
    const validatedData = createEnvironmentSchema.parse(input);

    // 3. Create environment via repository
    return environmentRepository.create({
      ...validatedData,
      projectId,
    });
  },
};