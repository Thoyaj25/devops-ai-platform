import { Project } from "@/types/project";

type Props = {
  project: Project;
};

export default function ProjectOverview({
  project,
}: Props) {
  return (
    <div className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">
        Project Overview
      </h2>

      <dl className="grid grid-cols-2 gap-6">
        <div>
          <dt className="font-medium text-gray-500">
            Status
          </dt>
          <dd>{project.status}</dd>
        </div>

        <div>
          <dt className="font-medium text-gray-500">
            Owner
          </dt>
          <dd>{project.owner.name}</dd>
        </div>

        <div>
          <dt className="font-medium text-gray-500">
            Created
          </dt>
          <dd>
            {new Date(project.createdAt).toLocaleString()}
          </dd>
        </div>

        <div>
          <dt className="font-medium text-gray-500">
            Updated
          </dt>
          <dd>
            {new Date(project.updatedAt).toLocaleString()}
          </dd>
        </div>
      </dl>
    </div>
  );
}