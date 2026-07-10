"use client";

import { useEffect, useState } from "react";
import type { DeploymentStatus } from "@/generated/prisma/enums";

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

    const source = new EventSource(
      `/api/deployments/${deploymentId}/stream`
    );

    source.onmessage = (event) => {
      const data: StreamPayload = JSON.parse(event.data);

      setLogs(data.logs ?? "");
      setStatus(data.status);

      if (
        data.status === "SUCCESS" ||
        data.status === "FAILED"
      ) {
        source.close();
      }
    };

    source.onerror = () => {
      source.close();
    };

    return () => {
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