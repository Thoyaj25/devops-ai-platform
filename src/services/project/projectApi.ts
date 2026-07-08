import { Project } from "@/types/project";

export async function getProjects(): Promise<Project[]> {
  const response = await fetch("/api/projects");

  if (!response.ok) {
    throw new Error("Failed to fetch projects");
  }

  return response.json();
}

export async function getProject(id: string): Promise<Project> {
  const response = await fetch(`/api/projects/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch project");
  }

  return response.json();
}