import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { logger } from "@/lib/logger";

import { authOptions } from "@/lib/auth/config";
import { permissions } from "@/lib/auth/permissions";
import { projectService } from "@/services/project/projectService";
import { auditService } from "@/services/audit/auditService";

export async function GET() {
  try {
    const projects = await projectService.getProjects();

    return NextResponse.json(projects);
  } catch (error) {
    logger.error({ error }, "Failed to fetch projects");

    return NextResponse.json(
      { error: "Failed to fetch projects" },
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

    if (!permissions.canCreateProject(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const project = await projectService.createProject(
      {
        name: body.name,
        description: body.description,
      },
      session.user.id
    );

    await auditService.log({
      action: "CREATE_PROJECT",
      resource: "PROJECT",
      userId: session.user.id,
      metadata: { name: project.name, resourceId: project.id },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    logger.error({ error }, "Failed to create project");

    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}