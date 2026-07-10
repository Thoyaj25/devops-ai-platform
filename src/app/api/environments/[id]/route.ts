import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { logger } from "@/lib/logger";

import { environmentService } from "@/services/environment/environmentService";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: Props
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

    const environment = await environmentService.getEnvironment(id);

    if (!environment) {
      return NextResponse.json(
        { error: "Environment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(environment);
  } catch (error) {
    logger.error(
      { error },
      "Failed to fetch environment"
    );

    return NextResponse.json(
      {
        error: "Failed to fetch environment",
      },
      {
        status: 500,
      }
    );
  }
}