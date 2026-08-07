"use client";

import { useEffect, useState } from "react";

import DeploymentForm from "@/components/forms/DeploymentForm";
import DeploymentHistory from "./DeploymentHistory";

type Project = {
  id: string;
  name: string;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
};

export default function DeploymentDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await fetch("/api/projects");

        if (!response.ok) {
          throw new Error("Failed to load projects");
        }

        const result =
          (await response.json()) as ApiResponse<Project[]>;

        if (!result.success) {
          throw new Error(
            result.error ?? "Failed to load projects"
          );
        }

        const projectList = result.data ?? [];

        setProjects(projectList);

        if (projectList.length > 0) {
          setSelectedProjectId(projectList[0].id);
        }
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load projects"
        );
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border p-6">
        Loading projects...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border border-red-300 bg-red-50 p-4 text-red-600">
        {error}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border p-6">
        <h2 className="text-xl font-semibold">
          No Projects
        </h2>

        <p className="mt-2 text-gray-500">
          Create a project before creating deployments.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <label className="mb-2 block font-medium">
          Project
        </label>

        <select
          className="w-full rounded border p-2"
          value={selectedProjectId}
          onChange={(e) =>
            setSelectedProjectId(e.target.value)
          }
        >
          <option value="">
            Select a project
          </option>

          {projects.map((project) => (
            <option
              key={project.id}
              value={project.id}
            >
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {selectedProjectId && (
        <>
          <DeploymentForm
            projectId={selectedProjectId}
          />

          <DeploymentHistory
            projectId={selectedProjectId}
          />
        </>
      )}
    </div>
  );
}