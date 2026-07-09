import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { environmentService } from "@/services/environment/environmentService";
import { logger } from "@/lib/logger";
import { createEnvironmentSchema } from "@/lib/validation/environment";


export async function POST(req: Request) {
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


    const body = await req.json();


    const validated = createEnvironmentSchema.parse(body);


    const environment =
      await environmentService.createEnvironment(
        {
          name: validated.name,
          type: validated.type,
        },
        validated.projectId,
        session.user.id
      );


    return NextResponse.json(
      environment,
      {
        status: 201,
      }
    );


  } catch (error) {

    logger.error(
      {
        error,
      },
      "Failed to create environment"
    );


    return NextResponse.json(
      {
        error: "Failed to create environment",
      },
      {
        status: 500,
      }
    );
  }
}