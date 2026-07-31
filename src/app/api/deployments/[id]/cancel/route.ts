import { NextResponse } from "next/server";

import { deploymentJobService } from "@/services/deployment/deploymentJobService";
import { deploymentJobRepository } from "@/repositories/deploymentJobRepository";

export const dynamic = "force-dynamic";

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deploymentId } = await params;

    const jobs =
      await deploymentJobRepository.findByDeploymentId(
        deploymentId
      );

    if (!jobs.length) {
      return NextResponse.json(
        {
          error: "No deployment job found",
        },
        {
          status: 404,
        }
      );
    }

    const activeJob =
      jobs.find(
        (job) =>
          job.status === "PENDING" ||
          job.status === "RUNNING"
      );

    if (!activeJob) {
      return NextResponse.json(
        {
          error:
            "No active deployment job available for cancellation",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await deploymentJobService.requestCancellation(
        activeJob.id
      );

    return NextResponse.json(result);

  } catch (error) {
    console.error(
      "Failed to cancel deployment:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to cancel deployment",
      },
      {
        status: 500,
      }
    );
  }
}