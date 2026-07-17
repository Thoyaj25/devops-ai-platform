import { EnvironmentType } from "@/generated/prisma";
import { z } from "zod";

/**
 * Step 1 — Check your validation schema
 * Defines the strict requirements for creating an environment.
 */
export const createEnvironmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Environment name must be at least 3 characters")
    .max(100, "Environment name must not exceed 100 characters"),

  type: z.nativeEnum(EnvironmentType),

  projectId: z
    .string()
    .trim()
    .min(1, "Project ID is required"),
});

export type CreateEnvironmentInput = z.infer<
  typeof createEnvironmentSchema
>;

/**
 * Step 2 — Your route is still parsing JSON manually
 * To fix this, use the schema in your POST handler like this:
 * 
 * const body = await request.json();
 * const validation = createEnvironmentSchema.safeParse(body);
 */

/**
 * Step 3 — Validation errors should return 400
 * Use the following pattern in your route handler:
 * 
 * if (!validation.success) {
 *   return NextResponse.json(
 *     { error: "Invalid request", details: validation.error.format() },
 *     { status: 400 }
 *   );
 * }
 */