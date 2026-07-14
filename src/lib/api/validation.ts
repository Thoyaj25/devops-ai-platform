import { ZodSchema } from "zod";

export async function validateRequest<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<
  | { success: true; data: T }
  | { success: false; error: unknown }
> {
  const body = await request.json();

  const result = schema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      error: result.error.flatten(),
    };
  }

  return {
    success: true,
    data: result.data,
  };
}