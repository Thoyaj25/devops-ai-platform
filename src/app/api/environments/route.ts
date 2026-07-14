import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { permissions } from "@/lib/auth/permissions";
import { createEnvironmentSchema } from "@/lib/validation/environment";
import { environmentService } from "@/services/environment/environmentService";
import { projectService } from "@/services/project/projectService";
import { handleApiError, UnauthorizedError, ForbiddenError, BadRequestError } from "@/lib/api/errors";
import { ApiResponse } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new UnauthorizedError();

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) throw new BadRequestError("projectId is required");

    // Simplify: Authorization check
    const hasAccess = await projectService.isUserAssociatedWithProject(session.user.id, projectId);
    if (!hasAccess) throw new ForbiddenError();

    const environments = await environmentService.getProjectEnvironments(projectId);
    return ApiResponse.success(environments);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.role) throw new UnauthorizedError();

    if (!permissions.canCreateEnvironment(session.user.role)) {
      throw new ForbiddenError();
    }

    const body = await request.json();
    const validation = createEnvironmentSchema.safeParse(body);

    if (!validation.success) {
      throw new BadRequestError("Invalid request");
    }

    const { projectId, name, type } = validation.data;

    // Final POST flow: Authorize then create
    const hasAccess = await projectService.isUserAssociatedWithProject(session.user.id, projectId);
    if (!hasAccess) throw new ForbiddenError();

    const environment = await environmentService.createEnvironment(
      { name, type, projectId },
      session.user.id
    );

    return ApiResponse.success(environment, 201);
  } catch (error) {
    return handleApiError(error);
  }
}