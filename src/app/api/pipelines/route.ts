import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { logger } from "@/lib/logger";

import { authOptions } from "@/lib/auth/config";
import { permissions } from "@/lib/auth/permissions";
import { pipelineService } from "@/services/pipeline/pipelineService";
import { projectService } from "@/services/project/projectService";

/**
 * Step 1 — Inspect the routes
 * GET /api/pipelines: Fetches all pipelines for a given project.
 * POST /api/pipelines: Creates a new pipeline within a project.
 */

/**
 * Step 2 — Standardize GET /api/pipelines
 * Implements authentication and project-level authorization check.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // Standardize access control: ensure user has access to the project
    const hasAccess = await projectService.isUserAssociatedWithProject(
      session.user.id,
      projectId
    );

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const pipelines = await pipelineService.getProjectPipelines(projectId);
    return NextResponse.json(pipelines);
  } catch (error) {
    logger.error({ error }, "Failed to fetch pipelines");
    return NextResponse.json(
      { error: "Failed to fetch pipelines" },
      { status: 500 }
    );
  }
}

/**
 * Step 3 — Standardize POST /api/pipelines
 * Implements RBAC and project-level authorization check.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role-based access control check
    if (!permissions.canCreatePipeline(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    if (!body.projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // Standardize: Ensure user has access to the target project before creation
    const hasAccess = await projectService.isUserAssociatedWithProject(
      session.user.id,
      body.projectId
    );

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /**
     * Step 5 — Verify you don't trust client identity
     * Always derive userId from the authenticated server session,
     * never from the request body.
     */
    const pipeline = await pipelineService.createPipeline(
      {
        name: body.name,
        provider: body.provider,
        repository: body.repository,
        projectId: body.projectId,
      },
      session.user.id
    );

    return NextResponse.json(pipeline, { status: 201 });
  } catch (error) {
    logger.error({ error }, "Failed to create pipeline");

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create pipeline",
      },
      { status: 500 }
    );
  }
}