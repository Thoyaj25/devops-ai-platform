"use client";

import { useEffect, useState } from "react";
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

export default function DeploymentLogs({
  deploymentId,
  initialLogs = "",
  initialStatus = "RUNNING",
}: Props) {
  const [logs, setLogs] = useState(initialLogs);
  const [status, setStatus] = useState<DeploymentStatus>(initialStatus);

  useEffect(() => {
    if (!deploymentId) return;

    console.log("=== FRONTEND: Opening EventSource stream for deployment ===", deploymentId);

    const source = new EventSource(
      `/api/deployments/${deploymentId}/stream`
    );

    source.onopen = () => {
      console.log("=== FRONTEND: EventSource connection established successfully ===");
    };

    source.onmessage = (event) => {
      console.log("=== FRONTEND: Received message from stream ===", event.data);
      const data: StreamPayload = JSON.parse(event.data);

      setLogs(data.logs ?? "");
      setStatus(data.status);

      const terminalStates = [
  "SUCCESS",
  "FAILED",
  "SUPERSEDED",
  "CANCELLED",
];

if (terminalStates.includes(data.status)) {
  console.log(
    "=== FRONTEND: Deployment finished with status, closing stream ===",
    data.status
  );

  source.close();
}
    };

    source.onerror = (error) => {
      console.error("=== FRONTEND: EventSource connection error occurred ===", error);
      source.close();
    };

    return () => {
      console.log("=== FRONTEND: Cleaning up EventSource connection ===");
      source.close();
    };
  }, [deploymentId]);

  return (
    <div className="rounded-xl border p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Deployment Logs
        </h2>

        <span className="rounded bg-gray-100 px-3 py-1 text-sm">
          {status}
        </span>
      </div>

      <pre className="h-96 overflow-auto rounded bg-black p-4 text-sm text-green-400 whitespace-pre-wrap">
        {logs || "Waiting for logs..."}
      </pre>
    </div>
  );
}