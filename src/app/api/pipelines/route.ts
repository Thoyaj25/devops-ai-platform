import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { permissions } from "@/lib/auth/permissions";
import { pipelineService } from "@/services/pipeline/pipelineService";
import { projectService } from "@/services/project/projectService";

import {
  ApiResponse,
} from "@/lib/api/response";

import {
  handleApiError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
} from "@/lib/api/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      throw new UnauthorizedError();
    }

    const { searchParams } = new URL(request.url);

    const projectId = searchParams.get("projectId");

    if (!projectId) {
      throw new BadRequestError("projectId is required");
    }

    const hasAccess =
      await projectService.isUserAssociatedWithProject(
        session.user.id,
        projectId
      );

    if (!hasAccess) {
      throw new ForbiddenError();
    }

    const pipelines =
      await pipelineService.getProjectPipelines(projectId);

    return ApiResponse.success(pipelines);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.role) {
      throw new UnauthorizedError();
    }

    if (
      !permissions.canCreatePipeline(session.user.role)
    ) {
      throw new ForbiddenError();
    }

    const body = await request.json();

    if (!body.projectId) {
      throw new BadRequestError(
        "projectId is required"
      );
    }

    const hasAccess =
      await projectService.isUserAssociatedWithProject(
        session.user.id,
        body.projectId
      );

    if (!hasAccess) {
      throw new ForbiddenError();
    }

    const pipeline =
      await pipelineService.createPipeline(
        {
          name: body.name,
          provider: body.provider,
          repository: body.repository,
          projectId: body.projectId,
        },
        session.user.id
      );

    return ApiResponse.success(pipeline, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
