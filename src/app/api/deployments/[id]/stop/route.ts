import { NextRequest, NextResponse } from "next/server";
import { deploymentControlService } from "@/services/deployment/deploymentControlService";

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    // Await the params to resolve the dynamic route ID
    const { id } = await context.params;

    // Call the control service to stop the deployment
    const result = await deploymentControlService.stop(id);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to stop deployment",
      },
      {
        status: 500,
      }
    );
  }
}