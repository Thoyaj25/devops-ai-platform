import { NextResponse } from "next/server";
import { deploymentControlService } from "@/services/deployment/deploymentControlService";

export const dynamic = "force-dynamic";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await deploymentControlService.stop(id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to stop deployment:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to stop deployment",
      },
      { status: 500 }
    );
  }
}