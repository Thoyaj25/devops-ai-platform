import { logger } from "@/lib/logger";
import { DeploymentProvider } from "./deploymentProvider";

export class DockerDeploymentProvider implements DeploymentProvider {
  private async runStage(stage: string): Promise<void> {
    logger.info(`${stage} started`);

    // Temporary simulation.
    // Real Docker/Kubernetes commands will be added in a later milestone.
    await new Promise((resolve) => setTimeout(resolve, 1000));

    logger.info(`${stage} completed`);
  }

  async checkout(): Promise<void> {
    await this.runStage("Checkout");
  }

  async build(): Promise<void> {
    await this.runStage("Build");
  }

  async push(): Promise<void> {
    await this.runStage("Push");
  }

  async deploy(): Promise<void> {
    await this.runStage("Deploy");
  }
}