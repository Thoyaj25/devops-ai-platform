import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { permissions } from "@/lib/auth/permissions";
import { projectService } from "@/services/project/projectService";
import { handleApiError } from "@/lib/api/errors";
import { ApiResponse } from "@/lib/api/response";
// Step 1: Update the imports to use the centralized error handler classes
import { UnauthorizedError, ForbiddenError, BadRequestError } from "@/lib/api/errors"; 

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      throw new UnauthorizedError();
    }

    const projects = await projectService.getProjectsByUserId(session.user.id);
    
    return ApiResponse.success(projects);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.role) {
      throw new UnauthorizedError();
    }

    if (!permissions.canCreateProject(session.user.role)) {
      throw new ForbiddenError();
    }

    const body = await request.json();

    if (!body.name) {
      throw new BadRequestError("Project name is required");
    }

    const project = await projectService.createProject(
      {
        name: body.name,
        description: body.description,
      },
      session.user.id
    );

    return ApiResponse.success(project, 201);
  } catch (error) {
    return handleApiError(error);
  }
}