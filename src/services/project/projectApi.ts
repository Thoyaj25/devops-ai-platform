import { Project } from "@/types/project";

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export async function getProjects(): Promise<Project[]> {
  const response = await fetch("/api/projects");

  if (!response.ok) {
    throw new Error("Failed to fetch projects");
  }

  const json: ApiSuccessResponse<Project[]> = await response.json();

  return json.data;
}

export async function getProject(id: string): Promise<Project> {
  const response = await fetch(`/api/projects/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch project");
  }

  const json: ApiSuccessResponse<Project> = await response.json();

  return json.data;
}