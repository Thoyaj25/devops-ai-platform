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

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadOptions() {
      try {
        setFetching(true);

        const [
          environmentsResponse,
          pipelinesResponse,
        ] = await Promise.all([
          fetch(
            `/api/environments?projectId=${projectId}`
          ),
          fetch(
            `/api/pipelines?projectId=${projectId}`
          ),
        ]);

        const environmentsResult =
          (await environmentsResponse.json()) as ApiResponse<
            SelectOption[]
          >;

        const pipelinesResult =
          (await pipelinesResponse.json()) as ApiResponse<
            SelectOption[]
          >;

        if (!environmentsResult.success) {
          throw new Error(
            environmentsResult.error ??
              "Failed to load environments"
          );
        }

        if (!pipelinesResult.success) {
          throw new Error(
            pipelinesResult.error ??
              "Failed to load pipelines"
          );
        }

        setEnvironments(
          environmentsResult.data ?? []
        );

        setPipelines(
          pipelinesResult.data ?? []
        );

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
        "Please select environment and pipeline"
      );
      return;
    }


    try {
      setLoading(true);
      setMessage("Creating deployment...");


      const response = await fetch(
        "/api/deployments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId,
            environmentId,
            pipelineId,
          }),
        }
      );


      const result =
        (await response.json()) as ApiResponse<unknown>;


      if (!response.ok || !result.success) {
        throw new Error(
          result.error ??
            "Failed to create deployment"
        );
      }


      setMessage(
        "Deployment created successfully"
      );

      setEnvironmentId("");
      setPipelineId("");


    } catch (error) {

      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Deployment failed"
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

  console.log("Environments:", environments);
  console.log("Pipelines:", pipelines);
  console.log("Fetching:", fetching);
  console.log("Project:", projectId);

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
            onChange={(event) =>
              setEnvironmentId(
                event.target.value
              )
            }
          >
            <option value="">
              Select environment
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
        </div>


        <div>
          <label className="mb-1 block text-sm font-medium">
            Pipeline
          </label>

          <select
            className="w-full rounded border p-2"
            value={pipelineId}
            onChange={(event) =>
              setPipelineId(
                event.target.value
              )
            }
          >
            <option value="">
              Select pipeline
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
        </div>


        <button
          type="button"
          disabled={loading}
          onClick={handleDeploy}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading
            ? "Deploying..."
            : "Deploy"}
        </button>


        {message && (
          <p className="text-sm">
            {message}
          </p>
        )}

      </div>

    </div>
  );
}