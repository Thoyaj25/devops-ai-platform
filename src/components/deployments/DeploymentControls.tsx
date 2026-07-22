"use client";

import { useState } from "react";

type Props = {
  deploymentId: string;
};

export default function DeploymentControls({
  deploymentId,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function callApi(endpoint: string) {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/deployments/${deploymentId}/${endpoint}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      console.log(result);

      if (!response.ok) {
        alert(result.error ?? "Request failed");
        return;
      }

      alert(result.message);
    } catch (error) {
      console.error(error);
      alert("Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
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
        className="rounded bg-gray-700 px-4 py-2 text-white"
      >
        Inspect
      </button>

      <button
        className="rounded bg-black px-4 py-2 text-white"
      >
        Remove
      </button>
    </div>
  );
}