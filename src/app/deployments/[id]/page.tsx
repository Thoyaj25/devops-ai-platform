import { notFound } from "next/navigation";
import Link from "next/link";

import { DeploymentStatus } from "@/generated/prisma";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import DeploymentLogs from "@/components/deployments/DeploymentLogs";
import DeploymentControls from "@/components/deployments/DeploymentControls";

import { deploymentService } from "@/services/deployment/deploymentService";
import { deploymentLogService } from "@/services/deployment/logs/deploymentLogService";

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

const ACTIVE_DEPLOYMENT_STATES: DeploymentStatus[] = [
  "PENDING",
  "CHECKING_OUT",
  "BUILDING",
  "DEPLOYING",
  "HEALTH_CHECKING",
];

export default async function DeploymentPage({
  params,
}: Props) {
  const { id } = await params;

  const deployment = await getDeployment(id);

  if (!deployment) {
    notFound();
  }

  const fetchedLogs = await deploymentLogService.getLogs(id);

  const initialLogText = fetchedLogs
    .map((entry) => entry.message)
    .join("\n");

  const isActive = deployment.status === "SUCCESS";

  const isDeploying = ACTIVE_DEPLOYMENT_STATES.includes(
    deployment.status
  );

  const isFailed = deployment.status === "FAILED";

  const isSuperseded =
    deployment.status === "SUPERSEDED";

  const isRollingBack =
    deployment.status === "ROLLING_BACK";

  const isRolledBack =
    deployment.status === "ROLLED_BACK";

  const localhostUrl = deployment.hostPort
    ? `http://localhost:${deployment.hostPort}`
    : null;

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-8">
      <h1 className="text-3xl font-bold">
        Deployment Details
      </h1>

      <Card title="Deployment Information">
        <div className="space-y-6">

          <div>
            <p className="text-sm text-gray-500">
              Deployment ID
            </p>

            <p className="font-mono break-all">
              {deployment.id}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Deployment State
            </p>

            {isActive && (
              <Badge>🟢 Active (Live)</Badge>
            )}

            {isDeploying && (
              <Badge>🔵 Deploying</Badge>
            )}

            {isRollingBack && (
              <Badge>🟠 Rolling Back</Badge>
            )}

            {isRolledBack && (
              <Badge>⚪ Rolled Back</Badge>
            )}

            {isSuperseded && (
              <Badge>🟡 Superseded</Badge>
            )}

            {isFailed && (
              <Badge>🔴 Failed</Badge>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Internal Status
            </p>

            <Badge>{deployment.status}</Badge>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Version
            </p>

            <p>{deployment.version ?? "N/A"}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Project
            </p>

            <p>{deployment.project.name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Environment
            </p>

            <p>{deployment.environment.name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Pipeline
            </p>

            <p>{deployment.pipeline.name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Container ID
            </p>

            <p className="font-mono break-all">
              {deployment.containerId ?? "Container Removed"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Host Port
            </p>

            {localhostUrl ? (
              <Link
                href={localhostUrl}
                target="_blank"
                className="text-blue-600 underline"
              >
                {deployment.hostPort}
              </Link>
            ) : (
              <p>-</p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Container URL
            </p>

            {deployment.containerUrl ? (
              <Link
                href={deployment.containerUrl}
                target="_blank"
                className="break-all text-blue-600 underline"
              >
                {deployment.containerUrl}
              </Link>
            ) : (
              <p>-</p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Health
            </p>

            <Badge>
              {deployment.isHealthy
                ? "🟢 Healthy"
                : "🔴 Unhealthy"}
            </Badge>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Created
            </p>

            <p>
              {new Date(
                deployment.createdAt
              ).toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Last Updated
            </p>

            <p>
              {new Date(
                deployment.updatedAt
              ).toLocaleString()}
            </p>
          </div>

        </div>
      </Card>

      <Card title="Container Controls">
        <DeploymentControls
          deploymentId={deployment.id}
        />
      </Card>

      <Card title="Deployment Logs">
        <DeploymentLogs
          deploymentId={deployment.id}
          initialLogs={
            initialLogText ||
            deployment.logs ||
            ""
          }
          initialStatus={deployment.status}
        />
      </Card>
    </main>
  );
}