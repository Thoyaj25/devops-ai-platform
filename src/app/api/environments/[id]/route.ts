import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

import { environmentService } from "@/services/environment/environmentService";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  { params }: Props
) {
  try {
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