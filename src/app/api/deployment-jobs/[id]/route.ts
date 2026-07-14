import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { logger } from "@/lib/logger";
import { deploymentRepository } from "@/repositories/deploymentRepository";
import { deploymentJobService } from "@/services/deployment/deploymentJobService";
import { projectService } from "@/services/project/projectService";

/**
 * Step 1 — Inspect the routes
 * GET /api/deployment-jobs/:id retrieves a specific deployment job by ID.
 */

/**
 * Step 2 — Standardize GET /api/deployment-jobs/:id
 * Implements authentication and project-level authorization check.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const job = await deploymentJobService.findById(id);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const deployment = await deploymentRepository.findById(job.deploymentId);

    if (!deployment) {
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
    }

    const hasAccess = await projectService.isUserAssociatedWithProject(
      session.user.id,
      deployment.projectId
    );

    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(job);
  } catch (error) {
    logger.error({ error }, "Failed to fetch deployment job");
    return NextResponse.json(
      { error: "Failed to fetch deployment job" },
      { status: 500 }
    );
  }
}