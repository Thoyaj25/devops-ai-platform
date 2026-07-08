"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";

type Pipeline = {
  id: string;
  name: string;
};

type Props = {
  projectId: string;
  environmentId: string;
};

export default function DeploymentForm({
  projectId,
  environmentId,
}: Props) {
  const router = useRouter();

  const [version, setVersion] = useState("");
  const [pipelineId, setPipelineId] = useState("");
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadPipelines() {
      const response = await fetch(
        `/api/pipelines?projectId=${projectId}`
      );

      if (!response.ok) {
        return;
      }

      const data: Pipeline[] = await response.json();

      setPipelines(data);

      if (data.length > 0) {
        setPipelineId(data[0].id);
      }
    }

    loadPipelines();
  }, [projectId]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);

    try {
      const response = await fetch("/api/deployments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version,
          projectId,
          environmentId,
          pipelineId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create deployment");
      }

      setVersion("");

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Unable to create deployment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card
      title="Create Deployment"
      description="Deploy a new application version."
      className="mt-8"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <div>
          <label className="mb-2 block text-sm font-medium">
            Version
          </label>

          <Input
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="v1.0.0"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Pipeline
          </label>

          <select
            value={pipelineId}
            onChange={(e) =>
              setPipelineId(e.target.value)
            }
            className="w-full rounded-md border px-4 py-2"
          >
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

        <Button
          type="submit"
          disabled={loading || !pipelineId}
        >
          {loading
            ? "Creating..."
            : "Create Deployment"}
        </Button>
      </form>
    </Card>
  );
}