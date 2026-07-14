import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { logger } from "@/lib/logger";

import { environmentService } from "@/services/environment/environmentService";
import { projectService } from "@/services/project/projectService";

/**
 * Step 1 — Inspect the routes
 * GET /api/environments/:id retrieves a specific environment by ID.
 * 
 * Step 4 — Protect /api/environments/[id]
 * Ensures only authenticated users with project access can interact with an environment.
 * 
 * Step 5 — Verify you don't trust client identity
 * All operations derive user identity from the server-side session, 
 * never from request body parameters or headers.
 */

type Props = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * Step 2 — Standardize GET /api/environments/:id
 * Implements authentication and project-level authorization check.
 */
export async function GET(
  _request: Request,
  { params }: Props
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

    const environment = await environmentService.getEnvironment(id);

    if (!environment) {
      return NextResponse.json(
        { error: "Environment not found" },
        { status: 404 }
      );
    }

    // Standardize access control: ensure the authenticated user 
    // has access to the requested project.
    const hasAccess = await projectService.isUserAssociatedWithProject(
      session.user.id,
      environment.projectId
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json(environment);
  } catch (error) {
    logger.error({ error }, "Failed to fetch environment");

    return NextResponse.json(
      { error: "Failed to fetch environment" },
      { status: 500 }
    );
  }
}

/**
 * Standardize: POST logic for creating environments resides in 
 * /api/environments/route.ts, not in the [id] dynamic route file.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}