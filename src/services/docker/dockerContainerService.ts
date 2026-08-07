import { dockerClient } from "./dockerClient";

export const dockerContainerService = {

  async run(options: {
    name: string;
    image: string;
    network: string;
  }) {

    const result = await dockerClient.run(
      "docker",
      [
        "run",
        "-d",

        "--name",
        options.name,

        "--network",
        options.network,

        "--network-alias",
        options.name,

        "--restart",
        "unless-stopped",

        "-e",
        "HOSTNAME=0.0.0.0",

        options.image,
      ]
    );

    if (result.exitCode !== 0) {
      throw new Error(result.stderr);
    }

    return result.stdout.trim();
  },



  async remove(id: string) {

    const result = await dockerClient.run(
      "docker",
      [
        "rm",
        "-f",
        id,
      ]
    );

    if (result.exitCode !== 0) {
      throw new Error(result.stderr);
    }

  },



  async stop(id: string) {

    const result = await dockerClient.run(
      "docker",
      [
        "stop",
        id,
      ]
    );

    if (result.exitCode !== 0) {
      throw new Error(result.stderr);
    }

  },



  async start(id: string) {

    const result = await dockerClient.run(
      "docker",
      [
        "start",
        id,
      ]
    );

    if (result.exitCode !== 0) {
      throw new Error(result.stderr);
    }

  },



  async restart(id: string) {

    const result = await dockerClient.run(
      "docker",
      [
        "restart",
        id,
      ]
    );

    if (result.exitCode !== 0) {
      throw new Error(result.stderr);
    }

  },



  async inspect(id: string) {

    const result = await dockerClient.run(
      "docker",
      [
        "inspect",
        id,
      ]
    );

    if (result.exitCode !== 0) {
      throw new Error(result.stderr);
    }

    const data = JSON.parse(result.stdout)[0];

    return {
  id: data.Id,
  name: data.Name.replace("/", ""),
  image: data.Config.Image,
  status: data.State.Status,
  running: data.State.Running,

  health: data.State.Health
    ? {
        status: data.State.Health.Status,
        failingStreak: data.State.Health.FailingStreak,
        log: data.State.Health.Log,
      }
    : undefined,
};

  },



  async exists(id: string): Promise<boolean> {

    const result = await dockerClient.run(
      "docker",
      [
        "inspect",
        id,
      ]
    );

    return result.exitCode === 0;

  },



  async waitRunning(id: string) {

    for (let i = 0; i < 30; i++) {

      const info = await this.inspect(id);

      if (info.running) {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

    }

    throw new Error("Container failed to reach running state");

  },



  async waitHealthy(id: string, timeoutSeconds = 60) {

    for (let i = 0; i < timeoutSeconds; i++) {

      const info = await this.inspect(id);

      if (!info.running) {
        throw new Error("Container stopped before becoming healthy.");
      }

      if (!info.health) {
        return;
      }

      if (info.health.status === "healthy") {
        return;
      }

      if (info.health.status === "unhealthy") {
        throw new Error("Container became unhealthy.");
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

    }

    throw new Error("Timed out waiting for Docker HEALTHCHECK.");

  },

};