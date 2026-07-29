import { config } from "@/lib/config";
import { deploymentLogService } from "@/services/deployment/logs/deploymentLogService";
import { generateNginxConfig } from "./nginx/nginxConfigGenerator";
import { removeNginxConfig } from "./nginx/nginxConfigRemover";
import { nginxReloader } from "./nginx/nginxReloader";
import { verifyDeploymentRoute } from "./nginx/nginxSmokeTester";

export const proxyService = {
  async exposeDeployment(
    deploymentId: string,
    containerName: string
  ): Promise<void> {
    if (!deploymentId) {
      throw new Error("Deployment ID is required");
    }

    if (!containerName) {
      throw new Error("Container name is required");
    }

    const hostname = `${deploymentId}.${config.deploymentDomain}`;

    //
    // Generate nginx configuration
    //
    await deploymentLogService.append(
      deploymentId,
      `Generating nginx configuration for ${hostname}`
    );

    await generateNginxConfig(
      deploymentId,
      containerName,
      hostname
    );

    //
    // Validate and reload nginx
    //
    await deploymentLogService.append(
      deploymentId,
      "Reloading nginx configuration"
    );

    await nginxReloader.reload();

    //
    // Verify routing through nginx.
    // verifyDeploymentRoute() is responsible for retrying until
    // nginx is actually serving the deployment.
    //
    await deploymentLogService.append(
      deploymentId,
      "Verifying deployment route"
    );

    await verifyDeploymentRoute(deploymentId);

    await deploymentLogService.append(
      deploymentId,
      `Deployment successfully exposed at http://${hostname}`
    );
  },

  async removeDeployment(
    deploymentId: string
  ): Promise<void> {
    if (!deploymentId) {
      throw new Error("Deployment ID is required");
    }

    await deploymentLogService.append(
      deploymentId,
      "Removing nginx configuration"
    );

    await removeNginxConfig(deploymentId);

    await deploymentLogService.append(
      deploymentId,
      "Reloading nginx configuration"
    );

    await nginxReloader.reload();

    await deploymentLogService.append(
      deploymentId,
      "Deployment route removed successfully"
    );
  },
};