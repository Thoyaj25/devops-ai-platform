import { z } from "zod";

import { EnvironmentType } from "@/generated/prisma/enums";

export const createEnvironmentSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.nativeEnum(EnvironmentType),
});

export type CreateEnvironmentInput =
  z.infer<typeof createEnvironmentSchema>;