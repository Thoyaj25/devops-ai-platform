import { DeploymentStatus } from "@/generated/prisma";
import { deploymentRepository } from "@/repositories/deploymentRepository";
import { DockerDeploymentProvider } from "@/services/providers";
import { workspaceService } from "./workspace/workspaceService";
import { stageRunner } from "./stageRunner";
import { DeploymentStage } from "./stages";
import { deploymentLogService } from "./logs/deploymentLogService";
import { withTimeout } from "@/lib/utils/timeout";

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

    const {
      repository,
      branch,
      buildCommand,
      deployCommand,
    } = deployment.pipeline;

    if (!repository) {
      throw new Error(
        "Deployment pipeline repository is not configured"
      );
    }

    await deploymentLogService.append(
      deploymentId,
      `Workspace prepared: ${workspace}`
    );

    await deploymentRepository.update(deploymentId, {
      status: DeploymentStatus.RUNNING,
    });

    try {
      await deploymentLogService.append(
        deploymentId,
        "Deployment started"
      );

      // ----------------------------
      // CLONE
      // ----------------------------
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

      // ----------------------------
      // BUILD
      // ----------------------------
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

      // ----------------------------
      // PUSH
      // ----------------------------
      await stageRunner.run(
        deploymentId,
        DeploymentStage.PUSHING,
        async () => {
          const image = process.env.DOCKER_IMAGE;

          if (!image) {
            throw new Error(
              "DOCKER_IMAGE is not configured"
            );
          }

          await withTimeout(
            provider.push(
              deploymentId,
              image,
              deploymentId
            ),
            5 * 60 * 1000,
            "Push timed out"
          );
        }
      );

      // ----------------------------
      // DEPLOY
      // ----------------------------
      const runtime = await stageRunner.run(
        deploymentId,
        DeploymentStage.DEPLOYING,
        async () => {
          const image = process.env.DOCKER_IMAGE;

          if (!image) {
            throw new Error(
              "DOCKER_IMAGE is not configured"
            );
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

          await deploymentRepository.update(
            deploymentId,
            {
              containerId: result.containerId,
              hostPort: result.hostPort,
              containerUrl: result.containerUrl,
            }
          );

          return result;
        }
      );

      // ----------------------------
      // VERIFY
      // ----------------------------
      await stageRunner.run(
        deploymentId,
        DeploymentStage.VERIFYING,
        async () => {
          await deploymentLogService.append(
            deploymentId,
            `Verifying ${runtime.containerUrl}`
          );

          // Give Next.js a chance to finish booting.
          await sleep(3000);

          let lastError: unknown;

          for (let attempt = 1; attempt <= 30; attempt++) {
            try {
              await deploymentLogService.append(
                deploymentId,
                `Health check ${attempt}/30`
              );

              const response = await fetch(
                runtime.containerUrl,
                {
                  redirect: "follow",
                }
              );

              if (response.ok) {
                await deploymentRepository.update(
                  deploymentId,
                  {
                    isHealthy: true,
                    status: DeploymentStatus.SUCCESS,
                  }
                );

                await deploymentLogService.append(
                  deploymentId,
                  `Deployment verified successfully (HTTP ${response.status})`
                );

                return;
              }

              lastError = new Error(
                `HTTP ${response.status}`
              );

              await deploymentLogService.append(
                deploymentId,
                `Received HTTP ${response.status}`
              );
            } catch (err) {
              lastError = err;

              const error =
                err instanceof Error
                  ? `${err.name}: ${err.message}`
                  : String(err);

              await deploymentLogService.append(
                deploymentId,
                `Health check failed: ${error}`
              );
            }

            await sleep(1000);
          }

          throw (
            lastError ??
            new Error(
              "Deployment verification failed"
            )
          );
        }
      );

      await deploymentRepository.update(deploymentId, {
        status: DeploymentStatus.SUCCESS,
      });

      await deploymentLogService.append(
        deploymentId,
        "Deployment completed successfully"
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      await deploymentLogService.append(
        deploymentId,
        `Deployment failed: ${message}`
      );

      await deploymentRepository.update(deploymentId, {
        status: DeploymentStatus.FAILED,
      });

      throw error;
    } finally {
      await workspaceService.cleanup(deploymentId);
    }
  },
};