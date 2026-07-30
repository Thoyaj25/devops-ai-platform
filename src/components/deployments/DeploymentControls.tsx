"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  deploymentId: string;
  previousDeploymentId?: string | null;
};

type Action =
  | "start"
  | "stop"
  | "restart"
  | "remove"
  | "inspect"
  | "rollback"
  | null;

export default function DeploymentControls({
  deploymentId,
  previousDeploymentId,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState<Action>(null);
  const [message, setMessage] = useState("");

  const busy = loading !== null;
  const canRollback = Boolean(previousDeploymentId) && !busy;

  console.log("DEPLOYMENT CONTROLS RENDER", {
    deploymentId,
    previousDeploymentId,
    loading,
    busy,
    canRollback,
  });

  async function request(
    url: string,
    options?: RequestInit
  ) {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? "Request failed");
    }

    return data;
  }

  async function execute(
    action: "start" | "stop" | "restart" | "remove"
  ) {
    setLoading(action);
    setMessage("");

    try {
      const result = await request(
        `/api/deployments/${deploymentId}/${action}`,
        {
          method: "POST",
        }
      );

      setMessage(
  result.message ??
  "Rollback completed"
);

if (result.deploymentId) {
  router.push(`/deployments/${result.deploymentId}`);
} else {
  router.refresh();
}
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Operation failed"
      );
    } finally {
      setLoading(null);
    }
  }

  async function inspect() {
    setLoading("inspect");
    setMessage("");

    try {
      const result = await request(
        `/api/deployments/${deploymentId}/inspect`
      );

      setMessage(
        JSON.stringify(result, null, 2)
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Inspect failed"
      );
    } finally {
      setLoading(null);
    }
  }

  async function rollback() {
    if (!previousDeploymentId) {
      setMessage("No previous deployment available");
      return;
    }

    if (!window.confirm("Rollback deployment?")) {
      return;
    }

    setLoading("rollback");
    setMessage("");

    try {
      const result = await request(
        "/api/deployments/rollback",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deploymentId,
            previousDeploymentId,
          }),
        }
      );

      console.log("ROLLBACK RESPONSE", result);

setMessage(result.message ?? "Rollback completed");

await router.push(`/deployments/${result.deploymentId}`);

router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Rollback failed"
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button
          text="Start"
          disabled={busy}
          loading={loading === "start"}
          onClick={() => execute("start")}
        />

        <Button
          text="Stop"
          disabled={busy}
          loading={loading === "stop"}
          onClick={() => execute("stop")}
        />

        <Button
          text="Restart"
          disabled={busy}
          loading={loading === "restart"}
          onClick={() => execute("restart")}
        />

        <Button
          text="Inspect"
          disabled={busy}
          loading={loading === "inspect"}
          onClick={inspect}
        />

        <Button
          text="Rollback"
          disabled={!canRollback}
          loading={loading === "rollback"}
          onClick={rollback}
        />

        <Button
          text="Remove"
          disabled={busy}
          loading={loading === "remove"}
          onClick={() => {
            if (window.confirm("Remove deployment?")) {
              execute("remove");
            }
          }}
        />
      </div>

      {message && (
        <pre className="rounded border p-3 text-sm whitespace-pre-wrap">
          {message}
        </pre>
      )}
    </div>
  );
}

function Button({
  text,
  loading,
  disabled,
  onClick,
}: {
  text: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="rounded bg-blue-600 px-4 py-2 text-white transition disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Running..." : text}
    </button>
  );
}