import { notFound } from "next/navigation";

import DeploymentForm from "@/components/forms/DeploymentForm";
import DeploymentList from "@/components/deployments/DeploymentList";
import DeploymentLogs from "@/components/deployments/DeploymentLogs";

import { environmentService } from "@/services/environment/environmentService";
import { deploymentService } from "@/services/deployment/deploymentService";

type Props = {
  params: Promise<{
    id: string;
    environmentId: string;
  }>;
};

export default async function EnvironmentPage({
  params,
}: Props) {
  const { environmentId } = await params;

  const environment =
    await environmentService.getEnvironment(environmentId);

  if (!environment) {
    notFound();
  }

  const deployments =
    await deploymentService.getEnvironmentDeployments(environmentId);

  const latestDeployment = deployments[0];

  return (
    <main className="mx-auto max-w-7xl p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {environment.name}
          </h1>

          <p className="mt-2 text-gray-500">
            Type: {environment.type}
          </p>
        </div>

        <DeploymentForm projectId={environment.projectId} />
      </div>

      <section className="mt-8 rounded-lg border p-6">
        <h2 className="text-xl font-semibold">
          Environment Overview
        </h2>

        <div className="mt-4">
          Project: {environment.project.name}
        </div>
      </section>

      <div className="mt-8">
        <DeploymentList environmentId={environment.id} />
      </div>

      {latestDeployment && (
        <div className="mt-8">
          <DeploymentLogs
            deploymentId={latestDeployment.id}
          />
        </div>
      )}
    </main>
  );
}