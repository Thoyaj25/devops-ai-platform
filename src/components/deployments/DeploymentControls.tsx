"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  deploymentId: string;
};

export default function DeploymentControls({
  deploymentId,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [inspectData, setInspectData] = useState<unknown>(null);
  const hasInspectData = inspectData !== null && inspectData !== undefined;

  async function callApi(endpoint: string) {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        `/api/deployments/${deploymentId}/${endpoint}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Request failed");
      }

      setMessage(
        result.message ??
          "Operation completed successfully"
      );

      // Clear inspection output after state-changing operations
      if (
        endpoint === "start" ||
        endpoint === "stop" ||
        endpoint === "restart" ||
        endpoint === "remove"
      ) {
        setInspectData(null);
      }

      // Refresh Server Components so deployment data is updated
      router.refresh();
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Request failed"
      );
    } finally {
      setLoading(false);
    }
  }

  async function inspectDeployment() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        `/api/deployments/${deploymentId}/inspect`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Inspection failed"
        );
      }

      setInspectData(result);
      setMessage("Inspection completed successfully");
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Inspection failed"
      );
    } finally {
      setLoading(false);
    }
  }

  async function removeDeployment() {
    const confirmed = window.confirm(
      "Are you sure you want to remove this deployment?"
    );

    if (!confirmed) {
      return;
    }

    await callApi("remove");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button
          disabled={loading}
          onClick={() => callApi("start")}
          className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
        >
          Start
        </button>

        <button
          disabled={loading}
          onClick={() => callApi("stop")}
          className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-50"
        >
          Stop
        </button>

        <button
          disabled={loading}
          onClick={() => callApi("restart")}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          Restart
        </button>

        <button
          disabled={loading}
          onClick={inspectDeployment}
          className="rounded bg-gray-700 px-4 py-2 text-white disabled:opacity-50"
        >
          Inspect
        </button>

        <button
          disabled={loading}
          onClick={removeDeployment}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          Remove
        </button>
      </div>

      {message && (
        <div className="rounded border border-gray-300 bg-gray-100 p-3 text-sm">
          {message}
        </div>
      )}

      {hasInspectData && (
        <div>
          <h3 className="mb-2 font-semibold">
            Inspection Result
          </h3>

          <pre className="max-h-96 overflow-auto rounded bg-black p-4 text-xs text-green-400">
            {JSON.stringify(inspectData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}