import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

import { projectService } from "@/services/project/projectService";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const project = await projectService.getProject(id);

    return NextResponse.json(project);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Project not found"
    ) {
      return NextResponse.json(
        {
          error: "Project not found",
        },
        {
          status: 404,
        }
      );
    }

    logger.error(
      { error },
      "Failed to fetch project"
    );

    return NextResponse.json(
      {
        error: "Failed to fetch project",
      },
      {
        status: 500,
      }
    );
  }
}