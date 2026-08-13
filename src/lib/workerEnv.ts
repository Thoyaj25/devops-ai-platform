import { z } from "zod";

const workerEnvSchema = z.object({
  NODE_ENV: z.enum([
    "development",
    "test",
    "production",
  ]),

  DATABASE_URL: z.url(),
});

export const workerEnv = workerEnvSchema.parse({
  NODE_ENV: process.env.NODE_ENV,

  DATABASE_URL: process.env.DATABASE_URL,
});
