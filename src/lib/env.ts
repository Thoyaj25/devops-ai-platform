import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum([
    "development",
    "test",
    "production",
  ]),

  DATABASE_URL: z.url(),

  NEXTAUTH_SECRET: z.string().min(32),

  NEXTAUTH_URL: z.url(),

  REDIS_URL: z.url(),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,

  DATABASE_URL: process.env.DATABASE_URL,

  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,

  NEXTAUTH_URL: process.env.NEXTAUTH_URL,

  REDIS_URL: process.env.REDIS_URL,
});