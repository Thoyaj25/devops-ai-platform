"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DeploymentStatus } from "@/generated/prisma";

import Badge from "@/components/ui/Badge";

type Deployment = {
  id: string;
  version: string | null;
  status: DeploymentStatus;
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
  data?: T;
  error?: string;
};

type Props = {
  projectId: string;
};

const ACTIVE_DEPLOYMENT_STATES: DeploymentStatus[] = [
  "PENDING",
  "CHECKING_OUT",
  "BUILDING",
  "DEPLOYING",
  "HEALTH_CHECKING",
];

export default function DeploymentHistory({
  projectId,
}: Props) {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDeployments() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/deployments?projectId=${projectId}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch deployments");
        }

        const result =
          (await response.json()) as ApiResponse<
            Deployment[]
          >;

        if (!result.success) {
          throw new Error(
            result.error ??
              "Failed to fetch deployments"
          );
        }

        if (!mounted) {
          return;
        }

        setDeployments(result.data ?? []);
      } catch (err) {
        console.error(err);

        if (!mounted) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load deployments"
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDeployments();

    return () => {
      mounted = false;
    };
  }, [projectId]);

  if (loading) {
    return (
      <div className="rounded-xl border p-6">
        Loading deployments...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-red-600">
        {error}
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
          No deployments found for this project.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {deployments.map((deployment) => {
            const isActive =
              deployment.status === "SUCCESS";

            const isDeploying =
              ACTIVE_DEPLOYMENT_STATES.includes(
                deployment.status
              );

            const isRollingBack =
              deployment.status ===
              "ROLLING_BACK";

            const isRolledBack =
              deployment.status ===
              "ROLLED_BACK";

            const isSuperseded =
              deployment.status ===
              "SUPERSEDED";

            const isFailed =
              deployment.status ===
              "FAILED";

            return (
              <Link
                key={deployment.id}
                href={`/deployments/${deployment.id}`}
                className="block"
              >
                <div className="rounded-lg border p-4 transition hover:bg-gray-50 hover:shadow-md">

                  <div className="flex justify-between">

                    <div className="space-y-2">

                      <p className="font-semibold">
                        {deployment.version ??
                          "Unknown Version"}
                      </p>

                      <p className="break-all font-mono text-xs text-gray-500">
                        {deployment.id}
                      </p>

                      <p className="text-sm text-gray-500">
                        Environment:{" "}
                        {deployment.environment.name}
                      </p>

                      <p className="text-sm text-gray-500">
                        Pipeline:{" "}
                        {deployment.pipeline.name}
                      </p>

                      {deployment.hostPort && (
                        <p className="text-sm text-gray-500">
                          Port: {deployment.hostPort}
                        </p>
                      )}

                    </div>

                    <div className="flex flex-col items-end gap-2">

                      {isActive && (
                        <Badge>
                          🟢 Active
                        </Badge>
                      )}

                      {isDeploying && (
                        <Badge>
                          🔵 Deploying
                        </Badge>
                      )}

                      {isRollingBack && (
                        <Badge>
                          🟠 Rolling Back
                        </Badge>
                      )}

                      {isRolledBack && (
                        <Badge>
                          ⚪ Rolled Back
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