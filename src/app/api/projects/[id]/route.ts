import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
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
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

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