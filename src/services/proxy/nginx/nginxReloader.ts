import { commandRunner } from "@/services/commandRunner/commandRunner";
import { logger } from "@/lib/logger";

class NginxReloader {
  async validate(): Promise<void> {
    const result = await commandRunner.run({
      command: "docker",
      args: [
        "exec",
        "marketsphere-nginx",
        "nginx",
        "-t",
      ],
      cwd: process.cwd(),
    });

    // Log output for debugging visibility
    if (result.stdout) {
      logger.info({ message: "[NGINX TEST STDOUT]", output: result.stdout });
    }
    if (result.stderr) {
      logger.info({ message: "[NGINX TEST STDERR]", output: result.stderr });
    }

    if (result.exitCode !== 0) {
      throw new Error(
        `Invalid nginx configuration:\nSTDOUT:\n${result.stdout}\n\nSTDERR:\n${result.stderr}`
      );
    }
  }

  async reload(): Promise<void> {
    const result = await commandRunner.run({
      command: "docker",
      args: [
        "exec",
        "marketsphere-nginx",
        "nginx",
        "-s",
        "reload",
      ],
      cwd: process.cwd(),
    });

    if (result.stdout) {
      logger.info({ message: "[NGINX RELOAD STDOUT]", output: result.stdout });
    }
    if (result.stderr) {
      logger.info({ message: "[NGINX RELOAD STDERR]", output: result.stderr });
    }

    if (result.exitCode !== 0) {
      throw new Error(
        `Failed to reload nginx:\nSTDOUT:\n${result.stdout}\n\nSTDERR:\n${result.stderr}`
      );
    }
  }
}

const reloader = new NginxReloader();

/**
 * Validates nginx configuration before reloading.
 */
export async function reloadNginx(): Promise<void> {
  await reloader.validate();
  await reloader.reload();
}

export const nginxReloader = {
  reload: reloadNginx,
  validate: () => reloader.validate(),
};

export { NginxReloader };