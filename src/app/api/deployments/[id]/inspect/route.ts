import { NextRequest, NextResponse } from "next/server";
import { deploymentControlService } from "@/services/deployment/deploymentControlService";

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    // Await the params to resolve the dynamic route ID
    const { id } = await context.params;

    // Call the control service to inspect the deployment container
    const result = await deploymentControlService.inspect(id);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to inspect deployment",
      },
      {
        status: 500,
      }
    );
  }
}