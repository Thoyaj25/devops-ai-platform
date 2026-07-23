import { config } from "@/lib/config";
import { deploymentLogService } from "@/services/deployment/logs/deploymentLogService";
import { generateNginxConfig } from "./nginx/nginxConfigGenerator";
import { removeNginxConfig } from "./nginx/nginxConfigRemover";
import { nginxReloader } from "./nginx/nginxReloader";

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

    const hostname =
      `${deploymentId}.${config.deploymentDomain}`;

    await deploymentLogService.append(
      deploymentId,
      `Generating nginx config for ${hostname}`
    );

    await generateNginxConfig(
      deploymentId,
      containerName,
      hostname
    );

    await deploymentLogService.append(
      deploymentId,
      "Reloading nginx"
    );

    await nginxReloader.reload();

    await deploymentLogService.append(
      deploymentId,
      "Nginx configuration applied successfully"
    );
  },

  async removeDeployment(
    deploymentId: string
  ): Promise<void> {
    if (!deploymentId) {
      throw new Error("Deployment ID is required");
    }

    await removeNginxConfig(deploymentId);

    await nginxReloader.reload();
  },
};