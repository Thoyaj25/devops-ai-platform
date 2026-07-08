import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { pipelineService } from "@/services/pipeline/pipelineService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        {
          error: "projectId is required",
        },
        {
          status: 400,
        }
      );
    }

    const pipelines =
      await pipelineService.getProjectPipelines(projectId);

    return NextResponse.json(pipelines);
  } catch (error) {
    logger.error(
      { error },
      "Failed to fetch pipelines"
    );

    return NextResponse.json(
      {
        error: "Failed to fetch pipelines",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const pipeline =
      await pipelineService.createPipeline({
        name: body.name,
        provider: body.provider,
        repository: body.repository,
        projectId: body.projectId,
      });

    return NextResponse.json(pipeline, {
      status: 201,
    });
  } catch (error) {
    logger.error(
      { error },
      "Failed to create pipeline"
    );

    return NextResponse.json(
      {
        error: "Failed to create pipeline",
      },
      {
        status: 500,
      }
    );
  }
}