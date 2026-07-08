import { notFound } from "next/navigation";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { deploymentService } from "@/services/deployment/deploymentService";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

async function getDeployment(id: string) {
  try {
    return await deploymentService.getDeployment(id);
  } catch {
    return null;
  }
}

export default async function DeploymentPage({
  params,
}: Props) {
  const { id } = await params;

  const deployment = await getDeployment(id);

  if (!deployment) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-3xl font-bold">
        Deployment Details
      </h1>

      <Card title="Deployment Information">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Version</p>
            <p>{deployment.version ?? "Unknown"}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Status</p>
            <Badge>{deployment.status}</Badge>
          </div>

          <div>
            <p className="text-sm text-gray-500">Project</p>
            <p>{deployment.project.name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Environment</p>
            <p>{deployment.environment.name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Pipeline</p>
            <p>{deployment.pipeline.name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p>
              {new Date(deployment.createdAt).toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Logs</p>
            <pre className="rounded bg-gray-100 p-4 text-sm">
              {deployment.logs ?? "No logs available."}
            </pre>
          </div>
        </div>
      </Card>
    </main>
  );
}