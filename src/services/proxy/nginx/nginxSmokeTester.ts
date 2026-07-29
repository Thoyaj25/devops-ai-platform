import { config } from "@/lib/config";
import { commandRunner } from "@/services/commandRunner/commandRunner";

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function verifyDeploymentRoute(
  deploymentId: string
): Promise<void> {
  const host = `${deploymentId}.${config.deploymentDomain}`;

  const maxAttempts = 10;
  const delayMs = 1000;

  let lastError = "";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await commandRunner.run({
      command: "docker",
      args: [
        "exec",
        "marketsphere-nginx",
        "wget",
        "-qO-",
        "--header",
        `Host: ${host}`,
        "http://127.0.0.1/api/health",
      ],
      cwd: process.cwd(),
    });

    console.log("[NGINX SMOKE TEST]", {
      attempt,
      host,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
    });

    if (result.exitCode === 0) {
      const response = result.stdout.trim();

      if (response) {
        try {
          const json = JSON.parse(response) as {
            status?: string;
          };

          if (json.status === "ok") {
            console.log(
              `[NGINX SMOKE TEST] Passed after ${attempt} attempt(s).`
            );
            return;
          }

          lastError = `Unexpected response: ${response}`;
        } catch {
          lastError = `Invalid JSON response: ${response}`;
        }
      } else {
        lastError = "Smoke test returned an empty response.";
      }
    } else {
      lastError = [
        `Exit Code: ${result.exitCode}`,
        `STDERR: ${result.stderr}`,
        `STDOUT: ${result.stdout}`,
      ].join("\n");
    }

    if (attempt < maxAttempts) {
      console.log(
        `[NGINX SMOKE TEST] Attempt ${attempt} failed. Retrying in ${delayMs}ms...`
      );
      await sleep(delayMs);
    }
  }

  throw new Error(
    [
      `Smoke test failed after ${maxAttempts} attempts.`,
      "",
      lastError,
    ].join("\n")
  );
}