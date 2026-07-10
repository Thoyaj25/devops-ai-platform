import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { permissions } from "@/lib/auth/permissions";

import { environmentService } from "@/services/environment/environmentService";
import { projectService } from "@/services/project/projectService";

/**
 * Step 1 — Inspect the routes
 * This file handles project-scoped environment management.
 * GET /api/environments: Fetches all environments for a given project.
 * POST /api/environments: Creates a new environment within a project.
 */

/**
 * Step 2 — Standardize GET /api/environments
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

    const environments = await environmentService.getProjectEnvironments(projectId);

    return NextResponse.json(environments);
  } catch (error) {
    logger.error({ error }, "Failed to fetch environments");

    return NextResponse.json(
      { error: "Failed to fetch environments" },
      { status: 500 }
    );
  }
}

/**
 * Step 3 — Standardize POST /api/environments
 * Implements RBAC and project-level authorization check.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role-based access control check
    if (!permissions.canCreateEnvironment(session.user.role)) {
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

    const environment = await environmentService.createEnvironment(
      body,
      body.projectId,
      session.user.id
    );

    return NextResponse.json(environment, { status: 201 });
  } catch (error) {
    logger.error({ error }, "Failed to create environment");

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create environment",
      },
      { status: 500 }
    );
  }
}