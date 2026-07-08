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

  const [data, setData] =
    useState<Overview | null>(null);


  useEffect(() => {

    fetch("/api/dashboard/overview")
      .then((res) => res.json())
      .then(setData);

  }, []);


  if (!data) {
    return (
      <p>
        Loading dashboard...
      </p>
    );
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