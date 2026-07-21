import { config } from "@/lib/config";
import { generateNginxConfig } from "./nginx/nginxConfigGenerator";
import { removeNginxConfig } from "./nginx/nginxConfigRemover";
import { nginxReloader } from "./nginx/nginxReloader";

export const proxyService = {
  /**
   * Generate an nginx vhost for a deployment and reload nginx.
   */
  async exposeDeployment(
    deploymentId: string,
    containerName: string,
    _port: number
  ): Promise<void> {
    await generateNginxConfig(
      deploymentId,
      containerName,
      `${deploymentId}.${config.deploymentDomain}`
    );

    await nginxReloader.reload();
  },

  /**
   * Remove the nginx config for a deployment and reload nginx.
   *
   * NOTE:
   * removeNginxConfig() expects the deployment ID because the config
   * filename is "<deploymentId>.conf".
   */
  async removeDeployment(
    deploymentId: string
  ): Promise<void> {
    await removeNginxConfig(deploymentId);

    await nginxReloader.reload();
  },
};