import { generateNginxConfig } from "./nginx/nginxConfigGenerator";
import { removeNginxConfig } from "./nginx/nginxConfigRemover";
import { nginxReloader } from "./nginx/nginxReloader";

export const proxyService = {
  async exposeDeployment(
    deploymentId: string,
    containerName: string,
    port: number
  ) {
    await generateNginxConfig(
      deploymentId,
      containerName,
      `${deploymentId}.marketsphere.local`
    );

    await nginxReloader.reload();
  },

  async removeDeployment(deploymentId: string) {
    await removeNginxConfig(`${deploymentId}.marketsphere.local`);

    await nginxReloader.reload();
  },
};