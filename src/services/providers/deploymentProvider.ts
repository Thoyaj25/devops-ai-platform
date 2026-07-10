export interface DeploymentProvider {
  checkout(
    repository: string,
    branch: string,
    workspace: string
  ): Promise<void>;

  build(
    workspace: string,
    command?: string
  ): Promise<void>;

  push(): Promise<void>;

  deploy(
    workspace: string,
    command?: string
  ): Promise<void>;
}