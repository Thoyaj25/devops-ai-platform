import { config } from "@/lib/config";
import { DeploymentStatus } from "@/generated/prisma";
import { deploymentRepository } from "@/repositories/deploymentRepository";
import { DockerDeploymentProvider } from "@/services/providers";
import { workspaceService } from "./workspace/workspaceService";
import { stageRunner } from "./stageRunner";
import { DeploymentStage } from "./stages";
import { deploymentLogService } from "./logs/deploymentLogService";
import { withTimeout } from "@/lib/utils/timeout";
import { proxyService } from "@/services/proxy/proxyService";

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export const deploymentExecutor = {
  async execute(deploymentId: string) {
    const provider = new DockerDeploymentProvider();

    const workspace = await workspaceService.prepare(deploymentId);

    const deployment = await deploymentRepository.findById(deploymentId);

    if (!deployment) {
      throw new Error("Deployment not found");
    }

    const previousDeployment =
      await deploymentRepository.findPreviousSuccessfulDeployment(
        deployment.projectId,
        deploymentId
      );

    await deploymentLogService.append(
      deploymentId,
      `Previous deployment: ${
        previousDeployment ? previousDeployment.containerId : "NONE"
      }`
    );

    const {
      repository,
      branch,
      buildCommand,
      deployCommand,
    } = deployment.pipeline;

    if (!repository) {
      throw new Error("Deployment pipeline repository is not configured");
    }

    await deploymentLogService.append(
      deploymentId,
      `Workspace prepared: ${workspace}`
    );

    await deploymentRepository.update(deploymentId, {
      status: DeploymentStatus.RUNNING,
    });

    let deployedContainerId: string | undefined;

    try {
      await deploymentLogService.append(deploymentId, "Deployment started");

      // ---------------------------------
      // CLONING
      // ---------------------------------

      await stageRunner.run(
        deploymentId,
        DeploymentStage.CLONING,
        async () => {
          await withTimeout(
            provider.checkout(
              deploymentId,
              repository,
              workspace,
              branch ?? "main"
            ),
            5 * 60 * 1000,
            "Cloning timed out"
          );
        }
      );

      // ---------------------------------
      // BUILDING
      // ---------------------------------

      await stageRunner.run(
        deploymentId,
        DeploymentStage.BUILDING,
        async () => {
          await withTimeout(
            provider.build(
              deploymentId,
              workspace,
              buildCommand ?? undefined
            ),
            10 * 60 * 1000,
            "Build timed out"
          );
        }
      );

      // ---------------------------------
      // PUSHING
      // ---------------------------------

      await stageRunner.run(
        deploymentId,
        DeploymentStage.PUSHING,
        async () => {
          const image = process.env.DOCKER_IMAGE;

          if (!image) {
            throw new Error("DOCKER_IMAGE is not configured");
          }

          await withTimeout(
            provider.push(deploymentId, image, deploymentId),
            5 * 60 * 1000,
            "Push timed out"
          );
        }
      );

      // ---------------------------------
      // DEPLOYING
      // ---------------------------------

      const runtime = await stageRunner.run(
        deploymentId,
        DeploymentStage.DEPLOYING,
        async () => {
          const image = process.env.DOCKER_IMAGE;

          if (!image) {
            throw new Error("DOCKER_IMAGE is not configured");
          }

          const result = await withTimeout(
            provider.deploy(
              deploymentId,
              workspace,
              image,
              deploymentId,
              deployCommand ?? undefined
            ),
            5 * 60 * 1000,
            "Deployment timed out"
          );

          deployedContainerId = result.containerId;

          try {
            await deploymentRepository.update(deploymentId, {
              containerId: result.containerId,
              hostPort: result.hostPort,
              containerUrl: result.containerUrl,
            });
          } catch (dbError) {
            const dbMsg =
              dbError instanceof Error ? dbError.message : String(dbError);
            await deploymentLogService.append(
              deploymentId,
              `Error updating database with container details: ${dbMsg}`
            );
            throw dbError;
          }

          return result;
        }
      );

      // ---------------------------------
      // VERIFYING
      // ---------------------------------

      await stageRunner.run(
        deploymentId,
        DeploymentStage.VERIFYING,
        async () => {
          await deploymentLogService.append(
            deploymentId,
            `Verifying ${runtime.containerUrl}`
          );

          await sleep(3000);

          let lastError: unknown;

          for (let attempt = 1; attempt <= 30; attempt++) {
            try {
              await deploymentLogService.append(
                deploymentId,
                `Health check ${attempt}/30 -> ${runtime.containerUrl}`
              );

              const response = await fetch(runtime.containerUrl, {
                redirect: "follow",
              });

              if (response.ok) {
                // Expose through Nginx ONLY after successful health verification
                await proxyService.exposeDeployment(
                  deploymentId,
                  runtime.containerName,
                  runtime.hostPort
                );
                await deploymentLogService.append(
                  deploymentId,
                  `Deployment exposed at ${deploymentId}.${config.deploymentDomain}`
                );

                await deploymentRepository.update(deploymentId, {
                  isHealthy: true,
                  status: DeploymentStatus.SUCCESS,
                });

                await deploymentLogService.append(
                  deploymentId,
                  `Deployment verified successfully (HTTP ${response.status})`
                );

                if (previousDeployment?.containerId) {
                  try {
                    await deploymentLogService.append(
                      deploymentId,
                      `Cleaning up previous container: ${previousDeployment.containerId}`
                    );

                    await provider.remove(previousDeployment.containerId);

                    // Remove previous deployment's proxy/config
                    if (previousDeployment.id) {
                      await proxyService.removeDeployment(previousDeployment.id);
                    }

                    await deploymentLogService.append(
                      deploymentId,
                      `Successfully removed previous container: ${previousDeployment.containerId}`
                    );
                  } catch (cleanupError) {
                    const cleanupMsg =
                      cleanupError instanceof Error
                        ? cleanupError.message
                        : String(cleanupError);

                    await deploymentLogService.append(
                      deploymentId,
                      `Warning: Failed to clean up previous container: ${cleanupMsg}`
                    );
                  }
                }

                await deploymentLogService.append(
                  deploymentId,
                  "Deployment completed successfully"
                );

                return;
              }

              lastError = new Error(`HTTP ${response.status}`);

              await deploymentLogService.append(
                deploymentId,
                `Received HTTP ${response.status}`
              );
            } catch (err) {
              lastError = err;

              const message =
                err instanceof Error ? `${err.name}: ${err.message}` : String(err);

              await deploymentLogService.append(
                deploymentId,
                `Health check failed: ${message}`
              );
            }

            await sleep(1000);
          }

          throw lastError ?? new Error("Deployment verification failed");
        }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      await deploymentLogService.append(
        deploymentId,
        `Deployment failed: ${message}`
      );

      if (deployedContainerId) {
        try {
          await deploymentLogService.append(
            deploymentId,
            `Cleaning up failed deployment container: ${deployedContainerId}`
          );

          await provider.remove(deployedContainerId);

          // Remove proxy configuration if deployment fails
          try {
            await proxyService.removeDeployment(deploymentId);
          } catch {
            // Ignore proxy cleanup errors
          }

          await deploymentLogService.append(
            deploymentId,
            `Successfully removed failed container: ${deployedContainerId}`
          );
        } catch (cleanupError) {
          const cleanupMsg =
            cleanupError instanceof Error
              ? cleanupError.message
              : String(cleanupError);

          await deploymentLogService.append(
            deploymentId,
            `Warning: Failed to clean up container after failure: ${cleanupMsg}`
          );
        }
      }

      await deploymentRepository.update(deploymentId, {
        status: DeploymentStatus.FAILED,
      });

      throw error;
    } finally {
      await workspaceService.cleanup(deploymentId);
    }
  },
};