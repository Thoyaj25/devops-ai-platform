import { z } from "zod";

export async function validateRequest<T>(
  request: Request,
  schema: z.ZodType<T>
):
Promise<
  | { success: true; data: T }
  | { success: false; error: ReturnType<z.ZodError["flatten"]> }
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