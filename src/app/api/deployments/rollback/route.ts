import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { logger } from "@/lib/logger";

import { rollbackService } from "@/services/deployment/rollbackService";

export async function POST(
  request: NextRequest
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

    let body: {
      deploymentId?: string;
      previousDeploymentId?: string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON body",
        },
        {
          status: 400,
        }
      );
    }

    const {
      deploymentId,
      previousDeploymentId,
    } = body;


    if (!deploymentId || !previousDeploymentId) {
      return NextResponse.json(
        {
          error:
            "Both deploymentId and previousDeploymentId are required",
        },
        {
          status: 400,
        }
      );
    }


    const rollbackResult =
      await rollbackService.rollback(
        deploymentId,
        previousDeploymentId
      );


    return NextResponse.json(
      {
        success: true,
        message: "Rollback completed successfully",

        // frontend will redirect here
        deploymentId: rollbackResult.id,
      },
      {
        status: 200,
      }
    );


  } catch (error) {

    logger.error(
      {
        error:
          error instanceof Error
            ? error.message
            : error,
      },
      "Rollback request failed"
    );


    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Rollback failed",
      },
      {
        status: 500,
      }
    );
  }
}