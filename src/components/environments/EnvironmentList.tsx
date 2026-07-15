"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Spinner from "@/components/ui/Spinner";

type Environment = {
  id: string;
  name: string;
  type: string;
  createdAt: string;
};

interface EnvironmentListProps {
  projectId: string;
}

export default function EnvironmentList({
  projectId,
}: EnvironmentListProps) {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEnvironments() {
      try {
        const response = await fetch(
          `/api/environments?projectId=${projectId}`
        );

        if (!response.ok) {
          throw new Error("Failed to load environments");
        }

        const result = await response.json();

        // Standardized pattern: check for success and extract data
        if (!result.success) {
          throw new Error(result.error ?? "Failed to load environments");
        }

        setEnvironments(Array.isArray(result.data) ? result.data : []);
      } catch (error) {
        console.error("Failed to fetch environments:", error);
      } finally {
        setLoading(false);
      }
    }

    loadEnvironments();
  }, [projectId]);

  if (loading) {
    return <Spinner />;
  }

  return (
    <section className="mt-6">
      <h2 className="text-xl font-semibold">Environments</h2>

      {environments.length === 0 ? (
        <EmptyState
          title="No environments"
          description="Get started by creating your first deployment environment."
        />
      ) : (
        <div className="mt-4 space-y-3">
          {environments.map((environment) => (
            <Link
              key={environment.id}
              href={`/projects/${projectId}/environments/${environment.id}`}
            >
              <Card className="flex items-center justify-between p-4 transition hover:bg-gray-50">
                <div>
                  <div className="font-medium">{environment.name}</div>
                </div>
                <Badge>{environment.type}</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}