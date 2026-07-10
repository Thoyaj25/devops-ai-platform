import { z } from "zod";

export const createDeploymentSchema = z.object({
  version: z
    .string()
    .trim()
    .optional(),

  projectId: z
    .string()
    .trim()
    .min(1, "Project ID is required"),

  environmentId: z
    .string()
    .trim()
    .min(1, "Environment ID is required"),

  pipelineId: z
    .string()
    .trim()
    .min(1, "Pipeline ID is required"),
});

export type CreateDeploymentInput = z.infer<
  typeof createDeploymentSchema
>;