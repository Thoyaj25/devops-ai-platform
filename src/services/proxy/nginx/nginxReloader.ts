import { commandRunner } from "@/services/commandRunner/commandRunner";

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

    if (result.exitCode !== 0) {
      throw new Error(
        `Invalid nginx configuration:\n${result.stderr}`
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

    if (result.exitCode !== 0) {
      throw new Error(
        `Failed to reload nginx:\n${result.stderr}`
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
};

export { NginxReloader };