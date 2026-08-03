import { spawn, ChildProcess } from "node:child_process";

import { JobStatus } from "@/generated/prisma";
import { deploymentJobRepository } from "@/repositories/deploymentJobRepository";
import { DeploymentCancelledError } from "@/services/deployment/errors/deploymentCancelledError";

export interface CommandOptions {
  command: string;
  args?: string[];
  cwd: string;

  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;

  onStdout?: (data: string) => Promise<void> | void;
  onStderr?: (data: string) => Promise<void> | void;

  jobId?: string;
}

export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

function killProcessTree(child: ChildProcess) {
  if (!child.pid) {
    return;
  }

  try {
    process.kill(child.pid, "SIGTERM");
  } catch {}
}

export const commandRunner = {
  async run(
    options: CommandOptions
  ): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
      console.log(
        "[COMMAND]",
        new Date().toISOString(),
        options.command,
        options.args ?? []
      );

      const child = spawn(
        options.command,
        options.args ?? [],
        {
          cwd: options.cwd,
          env: {
            ...process.env,
            ...options.env,
          },
          shell: false,
        }
      );

      let stdout = "";
      let stderr = "";

      let cancelled = false;

      let timeout: NodeJS.Timeout | undefined;
      let killTimeout: NodeJS.Timeout | undefined;
      let cancellationInterval: NodeJS.Timeout | undefined;

      const callbacks = new Set<Promise<void>>();

      //
      // Cancellation polling
      //
      if (options.jobId) {
        const jobId = options.jobId;

        console.log(
          "[CANCEL POLLER START]",
          new Date().toISOString(),
          jobId
        );

        cancellationInterval = setInterval(async () => {
          console.log(
            "[CANCEL CHECK]",
            new Date().toISOString(),
            jobId
          );

          try {
            const job =
              await deploymentJobRepository.findById(jobId);

            console.log(
  `[CANCEL DB] ${new Date().toISOString()} jobId=${jobId} status=${job?.status} cancelRequestedAt=${job?.cancelRequestedAt}`
);

            if (
              job &&
              job.status === JobStatus.CANCEL_REQUESTED &&
              !cancelled
            ) {
              cancelled = true;

              console.log(
                "[CANCEL DETECTED]",
                new Date().toISOString(),
                jobId
              );

              killProcessTree(child);
            }
          } catch (error) {
            console.error(
              "[CANCEL POLLER ERROR]",
              new Date().toISOString(),
              error
            );
          }
        }, 1000);
      }

      const registerCallback = (
        callback?: (
          data: string
        ) => Promise<void> | void,
        data?: string
      ) => {
        if (!callback || !data) {
          return;
        }

        const result = callback(data);

        if (result instanceof Promise) {
          const promise = result.finally(() => {
            callbacks.delete(promise);
          });

          callbacks.add(promise);
        }
      };

      child.stdout?.on("data", (data) => {
        const text = data.toString();

        stdout += text;

        registerCallback(
          options.onStdout,
          text
        );
      });

      child.stderr?.on("data", (data) => {
        const text = data.toString();

        stderr += text;

        registerCallback(
          options.onStderr,
          text
        );
      });

      if (options.timeoutMs) {
        timeout = setTimeout(() => {
          console.error(
            "[TIMEOUT]",
            new Date().toISOString(),
            options.command
          );

          killProcessTree(child);

          killTimeout = setTimeout(() => {
            try {
              process.kill(
                child.pid!,
                "SIGKILL"
              );
            } catch {}
          }, 5000);
        }, options.timeoutMs);
      }

      child.on("error", (error) => {
        if (timeout) {
          clearTimeout(timeout);
        }

        if (killTimeout) {
          clearTimeout(killTimeout);
        }

        if (cancellationInterval) {
          clearInterval(cancellationInterval);
        }

        reject(
          new Error(
            `Command failed: ${options.command}: ${error.message}`
          )
        );
      });

      child.on(
        "close",
        async (code) => {
          if (timeout) {
            clearTimeout(timeout);
          }

          if (killTimeout) {
            clearTimeout(killTimeout);
          }

          if (cancellationInterval) {
            clearInterval(cancellationInterval);
          }

          try {
            await Promise.all(
              Array.from(callbacks)
            );

            console.log(
              "[COMMAND CLOSE]",
              new Date().toISOString(),
              {
                command: options.command,
                exitCode: code,
                cancelled,
              }
            );

            if (cancelled) {
              reject(
                new DeploymentCancelledError()
              );
              return;
            }

            resolve({
              exitCode: code ?? -1,
              stdout,
              stderr,
            });
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  },
};