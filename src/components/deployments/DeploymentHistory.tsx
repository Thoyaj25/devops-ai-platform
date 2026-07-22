"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import Badge from "@/components/ui/Badge";

type Deployment = {
  id: string;
  version: string | null;
  status: string;
  createdAt: string;
  isHealthy?: boolean;
  hostPort?: number | null;

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
          {deployments.map((deployment) => {
            const isActive =
              deployment.status === "SUCCESS";

            const isRunning =
              deployment.status === "RUNNING";

            const isFailed =
              deployment.status === "FAILED";

            const isSuperseded =
              deployment.status === "SUPERSEDED";

            return (
              <Link
                key={deployment.id}
                href={`/deployments/${deployment.id}`}
              >
                <div className="rounded-lg border p-4 transition hover:bg-gray-50 hover:shadow-md">

                  <div className="flex justify-between">

                    <div className="space-y-2">

                      <p className="font-semibold">
                        {deployment.version ??
                          "Unknown Version"}
                      </p>

                      <p className="font-mono text-xs text-gray-500 break-all">
                        {deployment.id}
                      </p>

                      <p className="text-sm text-gray-500">
                        Environment:
                        {" "}
                        {deployment.environment.name}
                      </p>

                      <p className="text-sm text-gray-500">
                        Pipeline:
                        {" "}
                        {deployment.pipeline.name}
                      </p>

                      {deployment.hostPort && (
                        <p className="text-sm text-gray-500">
                          Port:
                          {" "}
                          {deployment.hostPort}
                        </p>
                      )}

                    </div>

                    <div className="flex flex-col items-end gap-2">

                      {isActive && (
                        <Badge>
                          🟢 Active
                        </Badge>
                      )}

                      {isRunning && (
                        <Badge>
                          🔵 Deploying
                        </Badge>
                      )}

                      {isSuperseded && (
                        <Badge>
                          🟡 Superseded
                        </Badge>
                      )}

                      {isFailed && (
                        <Badge>
                          🔴 Failed
                        </Badge>
                      )}

                      {deployment.isHealthy && (
                        <Badge>
                          Healthy
                        </Badge>
                      )}

                      <p className="text-xs text-gray-500">
                        {new Date(
                          deployment.createdAt
                        ).toLocaleString()}
                      </p>

                    </div>

                  </div>

                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}