// src/lib/api/errors.ts

import { ApiResponse } from "@/lib/api/response";

export class ApiError extends Error {
  constructor(public message: string, public readonly statusCode: number) {
    super(message);
    this.name = "ApiError";
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "Bad Request") {
    super(message, 400);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Not Found") {
    super(message, 404);
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Conflict") {
    super(message, 409);
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return ApiResponse.error(error.message, error.statusCode);
  }

  if (error instanceof Error) {
    return ApiResponse.error(error.message, 500);
  }

  return ApiResponse.error("Internal Server Error", 500);
}