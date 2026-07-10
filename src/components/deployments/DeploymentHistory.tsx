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

        const data = await res.json();
        setDeployments(data);
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    {deployment.version ?? "Unknown Version"}
                  </p>

                  <p className="text-sm text-gray-500">
                    {deployment.environment.name}
                  </p>

                  <p className="text-sm text-gray-500">
                    {deployment.pipeline.name}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-medium">
                    {deployment.status}
                  </p>

                  <p className="text-xs text-gray-500">
                    {new Date(
                      deployment.createdAt
                    ).toLocaleString()}
                  </p>
                </div>
              </div>

              {deployment.jobs.length > 0 && (
                <div className="mt-3 border-t pt-3">
                  <p className="text-sm font-medium">
                    Job Status
                  </p>

                  {deployment.jobs.map((job) => (
                    <div
                      key={job.id}
                      className="mt-1 flex justify-between text-sm"
                    >
                      <span>{job.status}</span>
                      <span>Attempts: {job.attempts}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}