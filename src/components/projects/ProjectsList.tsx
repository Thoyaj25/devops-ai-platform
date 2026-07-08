"use client";

import { useEffect, useState } from "react";

import { getProjects } from "@/services/project/projectApi";
import { Project } from "@/types/project";

import ProjectCard from "./ProjectCard";

export default function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await getProjects();
        setProjects(data);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  if (loading) {
    return <p>Loading projects...</p>;
  }

  if (projects.length === 0) {
    return <p>No projects found.</p>;
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
        />
      ))}
    </div>
  );
}