import { Project } from "@/types/project";

type Props = {
  project: Project;
};

export default function ProjectHeader({
  project,
}: Props) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {project.name}
          </h1>

          <p className="mt-2 text-gray-600">
            {project.description}
          </p>
        </div>

        <span
          className={`rounded-md px-3 py-2 text-sm font-medium ${
            project.status === "ACTIVE"
              ? "bg-green-100 text-green-700"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          {project.status}
        </span>
      </div>

      <div className="mt-6 flex gap-8 text-sm text-gray-500">
        <div>
          <strong>Owner</strong>

          <p>{project.owner.name}</p>
        </div>

        <div>
          <strong>Email</strong>

          <p>{project.owner.email}</p>
        </div>

        <div>
          <strong>Created</strong>

          <p>
            {new Date(
              project.createdAt
            ).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}