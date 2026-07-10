import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { logger } from "@/lib/logger";

import { authOptions } from "@/lib/auth/config";
import { permissions } from "@/lib/auth/permissions";
import { pipelineService } from "@/services/pipeline/pipelineService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session?.user?.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!permissions.canCreatePipeline(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Logic for input validation is now encapsulated in pipelineService.createPipeline
    // utilizing the Zod schema.
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

    // Catch Zod validation errors specifically if needed, 
    // or return generic error message for internal failures
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create pipeline",
      },
      { status: 500 }
    );
  }
}