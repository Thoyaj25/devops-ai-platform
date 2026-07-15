"use client";

import { useEffect, useState } from "react";

type Deployment = {
  id: string;
  version: string | null;
  status: string;
  createdAt: string;

  environment: {
    name: string;
  };

  pipeline: {
    name: string;
  };

  jobs: {
    id: string;
    status: string;
    attempts: number;
  }[];
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
};

export default function DeploymentHistory({
  projectId,
}: {
  projectId: string;
}) {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDeployments() {
      try {
        const res = await fetch(
          `/api/deployments?projectId=${projectId}`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch deployments");
        }

        const result =
          (await res.json()) as ApiResponse<Deployment[]>;

        if (!result.success) {
          throw new Error(
            result.error ?? "Failed to fetch deployments"
          );
        }

        setDeployments(result.data ?? []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadDeployments();
  }, [projectId]);

  if (loading) {
    return (
      <div className="rounded-xl border p-6">
        Loading deployments...
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-6">
      <h2 className="text-2xl font-semibold">
        Deployment History
      </h2>

      {deployments.length === 0 ? (
        <p className="mt-4 text-gray-500">
          No deployments found.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {deployments.map((deployment) => (
            <div
              key={deployment.id}
              className="rounded-lg border p-4"
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">
                    {deployment.version ?? "Unknown"}
                  </p>

                  <p className="text-sm text-gray-500">
                    {deployment.environment.name}
                  </p>

                  <p className="text-sm text-gray-500">
                    {deployment.pipeline.name}
                  </p>
                </div>

                <div className="text-right">
                  <p>{deployment.status}</p>

                  <p className="text-xs text-gray-500">
                    {new Date(
                      deployment.createdAt
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}