import { NextRequest, NextResponse } from "next/server";
import { deploymentControlService } from "@/services/deployment/deploymentControlService";

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const result =
      await deploymentControlService.restart(id);

    return NextResponse.json(result);

  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to restart deployment",
      },
      {
        status: 500,
      }
    );
  }
}