export enum DeploymentStage {
  QUEUED = "QUEUED",

  CLONING = "CLONING",

  BUILDING = "BUILDING",

  PUSHING = "PUSHING",

  TESTING = "TESTING",

  DEPLOYING = "DEPLOYING",

  VERIFYING = "VERIFYING",

  COMPLETED = "COMPLETED",

  FAILED = "FAILED",
}

export const deploymentStages: DeploymentStage[] = [
  DeploymentStage.QUEUED,
  DeploymentStage.CLONING,
  DeploymentStage.BUILDING,
  DeploymentStage.TESTING,
  DeploymentStage.DEPLOYING,
  DeploymentStage.VERIFYING,
  DeploymentStage.COMPLETED,
];