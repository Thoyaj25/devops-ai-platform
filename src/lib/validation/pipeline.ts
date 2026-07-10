import { z } from "zod";

export const createPipelineSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Pipeline name is required")
    .max(100, "Pipeline name is too long"),

  projectId: z
    .string()
    .trim()
    .min(1, "Project ID is required"),

  provider: z
    .string()
    .trim()
    .optional(),

  repository: z
    .string()
    .trim()
    .optional(),
});

export type CreatePipelineInput = z.infer<
  typeof createPipelineSchema
>;