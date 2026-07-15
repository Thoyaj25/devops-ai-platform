"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";

type Pipeline = {
  id: string;
  name: string;
  provider: string | null;
  repository: string | null;
};

type Props = {
  projectId: string;
};

export default function PipelineList({ projectId }: Props) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPipelines() {
      try {
        const response = await fetch(`/api/pipelines?projectId=${projectId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch pipelines");
        }

        const result = await response.json();

        // Standardized pattern: check for success and extract data safely
        if (!result.success) {
          throw new Error(result.error ?? "Failed to load pipelines");
        }

        setPipelines(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchPipelines();
  }, [projectId]);

  return (
    <Card
      title="Pipelines"
      description="Registered CI/CD pipelines for this project."
      className="mt-8"
    >
      {loading ? (
        <p className="text-sm text-gray-500">Loading pipelines...</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : pipelines.length === 0 ? (
        <p className="text-sm text-gray-500">No pipelines configured yet.</p>
      ) : (
        <div className="space-y-4">
          {pipelines.map((pipeline) => (
            <div key={pipeline.id} className="rounded-lg border p-4">
              <h3 className="font-semibold">{pipeline.name}</h3>
              <p className="text-sm">Provider: {pipeline.provider ?? "N/A"}</p>
              <p className="text-sm">Repository: {pipeline.repository ?? "N/A"}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}