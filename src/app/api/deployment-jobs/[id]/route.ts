import { NextRequest, NextResponse } from "next/server";
import { deploymentJobService } from "@/services/deployment/deploymentJobService";

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  const { id } = await context.params;

  const job = await deploymentJobService.findById(id);

  if (!job) {
    return NextResponse.json(
      {
        error: "Job not found",
      },
      {
        status: 404,
      }
    );
  }

  return NextResponse.json(job);
}