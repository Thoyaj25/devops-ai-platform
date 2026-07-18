export type DeployResult = {
  containerId: string;
  hostPort: number;
  containerUrl: string;
};

export type ContainerInfo = {
  id: string;
  name: string;
  image: string;
  status: string;
  running: boolean;
};

export interface DeploymentProvider {
  /**
   * Clone application repository into workspace
   */
  checkout(
    deploymentId: string,
    repository: string,
    workspace: string,
    branch?: string
  ): Promise<void>;

  /**
   * Build application container image
   */
  build(
    deploymentId: string,
    workspace: string,
    command?: string
  ): Promise<void>;

  /**
   * Push image to container registry
   */
  push(
    deploymentId: string,
    image: string,
    tag: string
  ): Promise<void>;

  /**
   * Start application container
   */
  deploy(
    deploymentId: string,
    workspace: string,
    image: string,
    tag: string,
    command?: string
  ): Promise<DeployResult>;

  /**
   * Stop running container
   */
  stop(
    containerId: string
  ): Promise<void>;

  /**
   * Start stopped container
   */
  start(
    containerId: string
  ): Promise<void>;

  /**
   * Restart container
   */
  restart(
    containerId: string
  ): Promise<void>;

  /**
   * Remove container
   */
  remove(
    containerId: string
  ): Promise<void>;

  /**
   * Inspect container status
   */
  inspect(
    containerId: string
  ): Promise<ContainerInfo>;
}