import { z } from "zod";

export const createEnvironmentSchema = z.object({
  name: z
    .string()
    .min(2, "Environment name must contain at least 2 characters"),

  type: z.enum([
    "DEVELOPMENT",
    "STAGING",
    "PRODUCTION",
  ]),

  projectId: z
    .string()
    .min(1, "Project ID is required"),
});

export type CreateEnvironmentInput =
  z.infer<typeof createEnvironmentSchema>;