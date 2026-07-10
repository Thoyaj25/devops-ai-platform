import { spawn } from "node:child_process";

export interface CommandOptions {
  command: string;
  args?: string[];
  cwd: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;

  onStdout?: (data: string) => Promise<void> | void;
  onStderr?: (data: string) => Promise<void> | void;
}

export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export const commandRunner = {
  async run(options: CommandOptions): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
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

      // Track pending async callbacks to ensure we don't resolve prematurely
      const pendingCallbacks: Promise<void>[] = [];

      child.stdout.on("data", (data) => {
        const text = data.toString();
        stdout += text;

        if (options.onStdout) {
          const result = options.onStdout(text);
          if (result instanceof Promise) {
            pendingCallbacks.push(result);
          }
        }
      });

      child.stderr.on("data", (data) => {
        const text = data.toString();
        stderr += text;

        if (options.onStderr) {
          const result = options.onStderr(text);
          if (result instanceof Promise) {
            pendingCallbacks.push(result);
          }
        }
      });

      let timeout: NodeJS.Timeout | undefined;

      if (options.timeoutMs) {
        timeout = setTimeout(() => {
          child.kill("SIGTERM");
        }, options.timeoutMs);
      }

      child.on("error", reject);

      child.on("close", async (code) => {
        if (timeout) {
          clearTimeout(timeout);
        }

        // Wait for all outstanding async callbacks to complete
        try {
          await Promise.all(pendingCallbacks);
          resolve({
            exitCode: code ?? -1,
            stdout,
            stderr,
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  },
};