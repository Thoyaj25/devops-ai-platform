"use client";

import { useEffect, useState } from "react";
import StatsCard from "./StatsCard";

type Overview = {
  projects: number;
  deployments: number;
  users: number;
  clusters: number;
};

export default function DashboardOverview() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOverview() {
      try {
        const response = await fetch("/api/dashboard/overview");

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const result = await response.json();

        // Standardized pattern: check for success and extract data safely
        if (!result.success) {
          throw new Error(result.error ?? "Failed to load dashboard data");
        }

        // Ensure the returned data matches the expected shape
        setData(result.data as Overview);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      }
    }

    fetchOverview();
  }, []);

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  if (!data) {
    return <p>Loading dashboard...</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Projects"
        value={data.projects}
        description="Active DevOps projects"
      />
      <StatsCard
        title="Deployments"
        value={data.deployments}
        description="Total deployments"
      />
      <StatsCard
        title="Users"
        value={data.users}
        description="Platform users"
      />
      <StatsCard
        title="Kubernetes Clusters"
        value={data.clusters}
        description="Connected clusters"
      />
    </div>
  );
}