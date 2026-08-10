export class DeploymentHealthCheckError extends Error {
  constructor(
    message: string,
    public readonly containerId: string,
    public readonly containerName: string
  ) {
    super(message);
    this.name = "DeploymentHealthCheckError";
  }
}
