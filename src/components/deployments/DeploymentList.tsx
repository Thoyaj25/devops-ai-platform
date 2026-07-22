"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Spinner from "@/components/ui/Spinner";

type Deployment = {
  id: string;
  version: string | null;
  status: string;
  createdAt: string;
  isHealthy?: boolean;
  hostPort?: number | null;
};

type Props = {
  environmentId: string;
};

export default function DeploymentList({
  environmentId,
}: Props) {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDeployments() {
      try {
        const response = await fetch(
          `/api/deployments?environmentId=${environmentId}`
        );

        if (!response.ok) {
          throw new Error("Failed to load deployments");
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(
            result.error ?? "Failed to load deployments"
          );
        }

        setDeployments(
          Array.isArray(result.data) ? result.data : []
        );
      } catch (error) {
        console.error(
          "Failed to load deployments:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadDeployments();
  }, [environmentId]);

  if (loading) {
    return <Spinner />;
  }

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">
        Deployments
      </h2>

      {deployments.length === 0 ? (
        <EmptyState
          title="No deployments"
          description="Create your first deployment for this environment."
        />
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
                className="block"
              >
                <Card className="cursor-pointer transition-all hover:bg-gray-50 hover:shadow-md">

                  <div className="flex items-start justify-between">

                    <div className="space-y-2">

                      <h3 className="font-semibold">
                        {deployment.version ??
                          "Unknown Version"}
                      </h3>

                      <p className="font-mono text-xs text-gray-500 break-all">
                        {deployment.id}
                      </p>

                      <p className="text-sm text-gray-500">
                        {new Date(
                          deployment.createdAt
                        ).toLocaleString()}
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

                    </div>

                  </div>

                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}