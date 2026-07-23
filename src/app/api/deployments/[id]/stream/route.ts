import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/config";
import { logger } from "@/lib/logger";

import { deploymentLogService } from "@/services/deployment/logs/deploymentLogService";
import { deploymentRepository } from "@/repositories/deploymentRepository";
import { projectService } from "@/services/project/projectService";


const TERMINAL_STATES = [
  "SUCCESS",
  "FAILED",
  "SUPERSEDED",
] as const;


type TerminalState =
  (typeof TERMINAL_STATES)[number];



export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {

  try {

    const session =
      await getServerSession(
        authOptions
      );


    if (!session?.user?.id) {

      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status:401,
        }
      );

    }



    const { id } =
      await params;



    const deployment =
      await deploymentRepository.findById(
        id
      );


    if (!deployment) {

      return NextResponse.json(
        {
          error:"Deployment not found",
        },
        {
          status:404,
        }
      );

    }



    const hasAccess =
      await projectService.isUserAssociatedWithProject(
        session.user.id,
        deployment.projectId
      );


    if (!hasAccess) {

      return NextResponse.json(
        {
          error:"Forbidden",
        },
        {
          status:403,
        }
      );

    }



    const encoder =
      new TextEncoder();



    const stream =
      new ReadableStream({

        start(controller) {


          let closed = false;

          let lastPayload = "";

          let interval:
            NodeJS.Timeout | undefined;



          const close = () => {

            if (closed) {
              return;
            }


            closed = true;


            if (interval) {
              clearInterval(interval);
            }


            try {

              controller.close();

            }
            catch {

              // Already closed

            }

          };




          const send = async () => {

            if (closed) {
              return;
            }



            try {

              const current =
                await deploymentRepository.findById(
                  id
                );



              if (!current) {

                close();
                return;

              }



              const logs =
                await deploymentLogService.getLogs(
                  id
                );



              const payload = {

                status:
                  current.status,

                logs:
                  logs
                    .map(
                      (entry) =>
                        entry.message
                    )
                    .join("\n"),

              };



              const signature =
                JSON.stringify(payload);



              if (
                signature !== lastPayload
              ) {

                lastPayload =
                  signature;



                controller.enqueue(

                  encoder.encode(

                    `data: ${JSON.stringify(
                      payload
                    )}\n\n`

                  )

                );

              }



              if (
                TERMINAL_STATES.includes(
                  current.status as TerminalState
                )
              ) {

                close();

              }


            }
            catch(error) {


              logger.error(
                {
                  error,
                  deploymentId:id,
                },
                "Deployment SSE polling failed"
              );


              close();

            }

          };




          // Send immediately
          void send();



          // Poll every second
          interval =
            setInterval(
              () => {

                void send();

              },
              1000
            );



          // Keep proxies alive
          const heartbeat =
            setInterval(() => {

              if (!closed) {

                controller.enqueue(
                  encoder.encode(
                    ": heartbeat\n\n"
                  )
                );

              }

            },15000);



          request.signal.addEventListener(
            "abort",
            () => {

              clearInterval(
                heartbeat
              );

              close();

            }
          );


        },

      });



    return new Response(
      stream,
      {

        headers: {

          "Content-Type":
            "text/event-stream",

          "Cache-Control":
            "no-cache, no-transform",

          Connection:
            "keep-alive",

          "X-Accel-Buffering":
            "no",

        },

      }
    );


  }
  catch(error) {


    logger.error(
      {
        error,
      },
      "Failed deployment SSE endpoint"
    );


    return NextResponse.json(
      {
        error:
          "Failed to stream logs",
      },
      {
        status:500,
      }
    );

  }

}