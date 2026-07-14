import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { logger } from "@/lib/logger";

import { projectService } from "@/services/project/projectService";

/**
 * Step 1 — Inspect the routes
 * GET /api/projects/:id retrieves a specific project by ID.
 */

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * Step 2 — Standardize GET /api/projects/:id
 * Implements authentication and project-level authorization check.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const project = await projectService.getProject(id);

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    /**
     * Standardize access control: ensure the authenticated user 
     * has access to the requested project.
     */
    const hasAccess = await projectService.isUserAssociatedWithProject(
      session.user.id,
      id
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    logger.error(
      { error },
      "Failed to fetch project"
    );

    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}