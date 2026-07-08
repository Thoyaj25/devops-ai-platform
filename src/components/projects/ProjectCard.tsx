import Link from "next/link";

import { Project } from "@/types/project";

type Props = {
  project: Project;
};

export default function ProjectCard({ project }: Props) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block"
    >
      <article className="rounded-lg border p-5 shadow-sm transition-all hover:border-blue-500 hover:shadow-md">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {project.name}
          </h2>

          <span
            className={`rounded px-2 py-1 text-sm font-medium ${
              project.status === "ACTIVE"
                ? "bg-green-100 text-green-700"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {project.status}
          </span>
        </div>

        <p className="mt-3 text-gray-600">
          {project.description || "No description"}
        </p>

        <div className="mt-5 space-y-1 text-sm text-gray-500">
          <p>
            <strong>Owner:</strong>{" "}
            {project.owner?.name ?? project.owner.email}
          </p>

          <p>
            <strong>Created:</strong>{" "}
            {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>
      </article>
    </Link>
  );
}