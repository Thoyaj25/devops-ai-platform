"use client";

import {
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";

import type { DeploymentStatus } from "@/generated/prisma";


type Props = {
  deploymentId: string;
  initialLogs?: string;
  initialStatus?: DeploymentStatus;
};


type StreamPayload = {
  status: DeploymentStatus;
  logs: string | null;
};


type ConnectionState =
  | "Connecting"
  | "Streaming"
  | "Completed"
  | "Disconnected";


type ConnectionAction =
  | {
      type: "reset";
    }
  | {
      type: "streaming";
    }
  | {
      type: "completed";
    }
  | {
      type: "disconnected";
    };


function connectionReducer(
  state: ConnectionState,
  action: ConnectionAction
): ConnectionState {

  switch (action.type) {

    case "reset":
      return "Connecting";

    case "streaming":
      return "Streaming";

    case "completed":
      return "Completed";

    case "disconnected":
      return "Disconnected";

    default:
      return state;
  }
}


const TERMINAL_STATES: DeploymentStatus[] = [
  "SUCCESS",
  "FAILED",
  "SUPERSEDED",
];


export default function DeploymentLogs({
  deploymentId,
  initialLogs = "",
  initialStatus = "PENDING",
}: Props) {

  const [logs, setLogs] =
    useState(initialLogs);

  const [status, setStatus] =
    useState<DeploymentStatus>(initialStatus);


  const [
    connectionState,
    dispatchConnectionState,
  ] = useReducer(
    connectionReducer,
    TERMINAL_STATES.includes(initialStatus)
      ? "Completed"
      : "Connecting"
  );


  const eventSourceRef =
    useRef<EventSource | null>(null);



  useEffect(() => {

    if (!deploymentId) {
      return;
    }


    // Already finished deployment
    if (
      TERMINAL_STATES.includes(status)
    ) {
      dispatchConnectionState({
        type: "completed",
      });

      return;
    }


    eventSourceRef.current?.close();


    dispatchConnectionState({
      type: "reset",
    });


    const source =
      new EventSource(
        `/api/deployments/${deploymentId}/stream`
      );


    eventSourceRef.current = source;



    source.onopen = () => {

      console.log(
        "Deployment log stream connected"
      );


      dispatchConnectionState({
        type: "streaming",
      });

    };



    source.onmessage = (event) => {

      try {

        const data: StreamPayload =
          JSON.parse(event.data);


        setStatus(data.status);


        if (data.logs) {
          setLogs(data.logs);
        }



        if (
          TERMINAL_STATES.includes(
            data.status
          )
        ) {

          dispatchConnectionState({
            type: "completed",
          });


          source.close();

          eventSourceRef.current = null;

        }


      } catch(error) {

        console.error(
          "Invalid SSE payload",
          error
        );

      }

    };



    source.onerror = () => {

      console.error(
        "Deployment log stream disconnected"
      );


      dispatchConnectionState({
        type: "disconnected",
      });


      source.close();

      eventSourceRef.current = null;

    };



    return () => {

      source.close();

      eventSourceRef.current = null;

    };


  }, [deploymentId, status]);



  return (

    <div className="rounded-xl border p-6">


      <div className="mb-4 flex items-center justify-between">


        <h2 className="text-xl font-semibold">
          Deployment Logs
        </h2>



        <div className="flex gap-2">


          <span className="rounded bg-gray-100 px-3 py-1 text-sm">
            {status}
          </span>



          <span className="rounded bg-blue-100 px-3 py-1 text-sm">
            {connectionState}
          </span>


        </div>


      </div>




      <pre
        className="
          h-96
          overflow-auto
          whitespace-pre-wrap
          rounded
          bg-black
          p-4
          text-sm
          text-green-400
        "
      >
        {logs || "Waiting for deployment logs..."}
      </pre>


    </div>

  );
}