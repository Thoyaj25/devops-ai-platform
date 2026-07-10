"use client";

import { useEffect, useState } from "react";

import DeploymentLogs from "@/components/deployments/DeploymentLogs";

type Environment = {
  id: string;
  name: string;
};

type Pipeline = {
  id: string;
  name: string;
};

export default function DeploymentForm({
  projectId,
}: {
  projectId: string;
}) {
  const [version, setVersion] = useState("v1.0.0");
  const [environmentId, setEnvironmentId] = useState("");
  const [pipelineId, setPipelineId] = useState("");

  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);

  const [deploymentId, setDeploymentId] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [envRes, pipeRes] = await Promise.all([
          fetch(`/api/environments?projectId=${projectId}`),
          fetch(`/api/pipelines?projectId=${projectId}`),
        ]);

        if (!envRes.ok) {
          throw new Error("Failed to load environments");
        }

        if (!pipeRes.ok) {
          throw new Error("Failed to load pipelines");
        }

        const envs = await envRes.json();
        const pipes = await pipeRes.json();

        console.log("Environments:", envs);
        console.log("Pipelines:", pipes);

        setEnvironments(envs);
        setPipelines(pipes);
      } catch (error) {
        console.error("Failed to load deployment form:", error);
      }
    }

    load();
  }, [projectId]);

  async function createDeployment() {
    if (!environmentId) {
      alert("Please select an environment.");
      return;
    }

    if (!pipelineId) {
      alert("Please select a pipeline.");
      return;
    }

    const payload = {
      version,
      environmentId,
      pipelineId,
      projectId,
    };

    console.log("Submitting deployment:", payload);

    setLoading(true);

    try {
      const res = await fetch("/api/deployments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      console.log("Deployment response:", data);

      if (!res.ok) {
        throw new Error(
          data.error ?? "Failed to create deployment"
        );
      }

      // Save deployment id for live log streaming
      setDeploymentId(data.id);

      alert("Deployment created successfully!");
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "An unknown error occurred."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">
          Create Deployment
        </h2>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Version
            </label>

            <input
              className="w-full rounded border p-2"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            />
          </div>

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
                Select an environment
              </option>

              {environments.map((env) => (
                <option
                  key={env.id}
                  value={env.id}
                >
                  {env.name}
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
              onChange={(e) =>
                setPipelineId(e.target.value)
              }
            >
              <option value="">
                Select a pipeline
              </option>

              {pipelines.map((pipe) => (
                <option
                  key={pipe.id}
                  value={pipe.id}
                >
                  {pipe.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={createDeployment}
            disabled={loading}
            className={`w-full rounded px-4 py-2 text-white transition ${
              loading
                ? "cursor-not-allowed bg-gray-400"
                : "bg-black hover:bg-gray-800"
            }`}
          >
            {loading ? "Deploying..." : "Deploy"}
          </button>
        </div>
      </div>

      {deploymentId && (
        <div className="mt-8">
          <DeploymentLogs deploymentId={deploymentId} />
        </div>
      )}
    </>
  );
}