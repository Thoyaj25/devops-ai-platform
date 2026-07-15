"use client";

import { useEffect, useState } from "react";

type SelectOption = {
  id: string;
  name: string;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export default function DeploymentForm({
  projectId,
}: {
  projectId: string;
}) {
  const [environments, setEnvironments] = useState<SelectOption[]>([]);
  const [pipelines, setPipelines] = useState<SelectOption[]>([]);

  const [environmentId, setEnvironmentId] = useState("");
  const [pipelineId, setPipelineId] = useState("");

  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadOptions() {
      try {
        setFetching(true);
        setMessage("");

        const [environmentResponse, pipelineResponse] =
          await Promise.all([
            fetch(
              `/api/environments?projectId=${projectId}`,
              {
                credentials: "include",
              }
            ),
            fetch(
              `/api/pipelines?projectId=${projectId}`,
              {
                credentials: "include",
              }
            ),
          ]);

        if (
          environmentResponse.status === 401 ||
          pipelineResponse.status === 401
        ) {
          throw new Error(
            "You are not authenticated. Please log in again."
          );
        }

        const environmentResult =
          (await environmentResponse.json()) as ApiResponse<
            SelectOption[]
          >;

        const pipelineResult =
          (await pipelineResponse.json()) as ApiResponse<
            SelectOption[]
          >;

        if (!environmentResult.success) {
          throw new Error(
            environmentResult.error ??
              "Failed to load environments"
          );
        }

        if (!pipelineResult.success) {
          throw new Error(
            pipelineResult.error ??
              "Failed to load pipelines"
          );
        }

        setEnvironments(environmentResult.data ?? []);
        setPipelines(pipelineResult.data ?? []);
      } catch (error) {
        console.error(error);

        setMessage(
          error instanceof Error
            ? error.message
            : "Failed to load deployment options"
        );
      } finally {
        setFetching(false);
      }
    }

    loadOptions();
  }, [projectId]);

  async function handleDeploy() {
    if (!environmentId || !pipelineId) {
      setMessage(
        "Please select both Environment and Pipeline."
      );
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/deployments", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          environmentId,
          pipelineId,
        }),
      });

      const result =
        (await response.json()) as ApiResponse<unknown>;

      if (response.status === 401) {
        throw new Error(
          "You are not authenticated. Please log in again."
        );
      }

      if (!response.ok) {
        throw new Error(
          result.error ?? "Deployment creation failed."
        );
      }

      setMessage("Deployment created successfully.");

      setEnvironmentId("");
      setPipelineId("");

      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Deployment failed."
      );
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="rounded-xl border p-6">
        Loading deployment options...
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-6">
      <h2 className="text-xl font-semibold">
        Create Deployment
      </h2>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Environment
          </label>

          <select
            className="w-full rounded border p-2"
            value={environmentId}
            onChange={(e) =>
              setEnvironmentId(e.target.value)
            }
          >
            <option value="">
              Select Environment
            </option>

            {environments.map((environment) => (
              <option
                key={environment.id}
                value={environment.id}
              >
                {environment.name}
              </option>
            ))}
          </select>

          {environments.length === 0 && (
            <p className="mt-2 text-sm text-red-500">
              No environments available.
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Pipeline
          </label>

          <select
            className="w-full rounded border p-2"
            value={pipelineId}
            onChange={(e) =>
              setPipelineId(e.target.value)
            }
          >
            <option value="">
              Select Pipeline
            </option>

            {pipelines.map((pipeline) => (
              <option
                key={pipeline.id}
                value={pipeline.id}
              >
                {pipeline.name}
              </option>
            ))}
          </select>

          {pipelines.length === 0 && (
            <p className="mt-2 text-sm text-red-500">
              No pipelines available.
            </p>
          )}
        </div>

        <button
          type="button"
          disabled={
            loading ||
            environments.length === 0 ||
            pipelines.length === 0
          }
          onClick={handleDeploy}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Deploying..." : "Deploy"}
        </button>

        {message && (
          <div className="rounded bg-gray-100 p-3 text-sm">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}