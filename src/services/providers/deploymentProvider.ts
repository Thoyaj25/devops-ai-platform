export interface DeploymentProvider {
  checkout(
    deploymentId: string,
    repository: string,
    workspace: string,
    branch?: string
  ): Promise<void>;

  build(
    deploymentId: string,
    workspace: string,
    command?: string
  ): Promise<void>;

  push(deploymentId: string): Promise<void>;

  deploy(
    deploymentId: string,
    workspace: string,
    command?: string
  ): Promise<void>;
}