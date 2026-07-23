import DeploymentDashboard from "@/components/deployments/DeploymentDashboard";

export default function DeploymentsPage() {
  return (
    <main className="mx-auto max-w-7xl p-8">
      <h1 className="mb-8 text-3xl font-bold">
        Deployments
      </h1>

      <DeploymentDashboard />
    </main>
  );
}