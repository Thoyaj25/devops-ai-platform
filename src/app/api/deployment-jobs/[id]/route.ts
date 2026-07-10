import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { deploymentJobService } from "@/services/deployment/deploymentJobService";

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  // Step 3: Protect deployment job API with authentication
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

  // Optional: Add authorization check here if needed to ensure the user 
  // has permission to access this specific job

  return NextResponse.json(job);
}