import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { logger } from "@/lib/logger";

import { authOptions } from "@/lib/auth/config";
import { permissions } from "@/lib/auth/permissions";
import { pipelineService } from "@/services/pipeline/pipelineService";
import { projectService } from "@/services/project/projectService";

/**
 * Step 1 — Open pipeline API
 * GET /api/pipelines: Fetches pipelines for a project
 * POST /api/pipelines: Creates a new pipeline
 */

/**
 * Step 2 — Protect GET /api/pipelines
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

    // Validate project access
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
 * Step 3 — Protect POST /api/pipelines
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /**
     * Step 4 — Add permission check
     */
    if (!permissions.canCreatePipeline(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Validate project access
    const hasAccess = await projectService.isUserAssociatedWithProject(
      session.user.id,
      body.projectId
    );

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    /**
     * Step 5 — Never accept userId from request
     * Always derive userId from the authenticated server session
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