import fs from "fs/promises";
import path from "path";

const OUTPUT_DIRECTORY = path.resolve(
  process.cwd(),
  "nginx/conf.d"
);

export async function removeNginxConfig(
  deploymentId: string
): Promise<void> {
  const configFile = path.join(
    OUTPUT_DIRECTORY,
    `${deploymentId}.conf`
  );

  try {
    await fs.unlink(configFile);
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !("code" in error) ||
      (error as NodeJS.ErrnoException).code !== "ENOENT"
    ) {
      throw error;
    }
  }
}