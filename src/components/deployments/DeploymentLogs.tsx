"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  deploymentId: string;
  initialLogs: string | null;
  initialStatus: string;
};

export default function DeploymentLogs({
  deploymentId,
  initialLogs,
  initialStatus,
}: Props) {
  const [logs, setLogs] = useState(initialLogs ?? "");
  const [status, setStatus] = useState(initialStatus);

  const logRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const source = new EventSource(
      `/api/deployments/${deploymentId}/logs`
    );

    source.onmessage = (event) => {
      const data = JSON.parse(event.data);

      setLogs(data.logs ?? "");
      setStatus(data.status);

      if (logRef.current) {
        logRef.current.scrollTop =
          logRef.current.scrollHeight;
      }
    };

    source.onerror = () => {
      source.close();
    };

    return () => source.close();
  }, [deploymentId]);

  return (
    <div className="space-y-4">
      <div>
        <span className="font-semibold">Live Status:</span>{" "}
        {status}
      </div>

      <pre
        ref={logRef}
        className="h-96 overflow-y-auto rounded-lg bg-black p-4 text-sm text-green-400"
      >
        {logs || "Waiting for deployment logs..."}
      </pre>
    </div>
  );
}