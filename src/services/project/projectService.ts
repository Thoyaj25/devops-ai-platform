import {
  createProjectSchema,
  type CreateProjectInput,
} from "@/lib/validation/project";
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
      throw new Error("Project not found");
    }

    return project;
  },

  async isUserAssociatedWithProject(userId: string, projectId: string) {
    const project = await projectRepository.findByIdForOwner(projectId, userId);
    return Boolean(project);
  },

  async createProject(
    input: CreateProjectInput,
    ownerId: string
  ) {
    const data = createProjectSchema.parse(input);

    const project = await projectRepository.create({
      ...data,
      ownerId,
    });

    await auditService.log({
      action: "CREATE_PROJECT",
      resource: "PROJECT",
      userId: ownerId,
      metadata: { name: project.name, resourceId: project.id },
    });

    return project;
  },
};