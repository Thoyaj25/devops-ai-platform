"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    async function load() {
      const envRes = await fetch(
        `/api/environments?projectId=${projectId}`
      );

      const pipeRes = await fetch(
        `/api/pipelines?projectId=${projectId}`
      );

      setEnvironments(await envRes.json());

      setPipelines(await pipeRes.json());
    }

    load();
  }, [projectId]);

  async function createDeployment() {
    const res = await fetch("/api/deployments", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        version,
        environmentId,
        pipelineId,
        projectId,
      }),
    });

    const deployment = await res.json();

    console.log(deployment);

    alert("Deployment created");
  }

  return (
    <div className="rounded-xl border p-6">
      <h2 className="text-2xl font-semibold">
        Create Deployment
      </h2>

      <div className="mt-4 space-y-4">
        <input
          className="w-full rounded border p-2"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
        />

        <select
          className="w-full rounded border p-2"
          value={environmentId}
          onChange={(e) =>
            setEnvironmentId(e.target.value)
          }
        >
          <option value="">Environment</option>

          {environments.map((env) => (
            <option key={env.id} value={env.id}>
              {env.name}
            </option>
          ))}
        </select>

        <select
          className="w-full rounded border p-2"
          value={pipelineId}
          onChange={(e) =>
            setPipelineId(e.target.value)
          }
        >
          <option value="">Pipeline</option>

          {pipelines.map((pipe) => (
            <option key={pipe.id} value={pipe.id}>
              {pipe.name}
            </option>
          ))}
        </select>

        <button
          onClick={createDeployment}
          className="rounded bg-black px-4 py-2 text-white"
        >
          Deploy
        </button>
      </div>
    </div>
  );
}