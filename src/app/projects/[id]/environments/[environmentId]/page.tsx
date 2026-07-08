import { notFound } from "next/navigation";

import DeploymentForm from "@/components/forms/DeploymentForm";
import DeploymentList from "@/components/deployments/DeploymentList";
import { environmentService } from "@/services/environment/environmentService";

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

  const environment = await environmentService.getEnvironment(environmentId);

  if (!environment) {
    notFound();
  }

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
        
        <DeploymentForm 
          projectId={environment.projectId} 
          environmentId={environment.id} 
        />
      </div>

      <section className="mt-8 rounded-lg border p-6">
        <h2 className="text-xl font-semibold">
          Environment Overview
        </h2>

        <div className="mt-4">
          Project: {environment.project.name}
        </div>
      </section>

      <DeploymentList environmentId={environment.id} />
    </main>
  );
}