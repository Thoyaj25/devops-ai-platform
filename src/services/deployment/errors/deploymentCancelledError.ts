export class DeploymentCancelledError extends Error {
  constructor() {
    super("Deployment cancelled");
    this.name = "DeploymentCancelledError";
  }
}