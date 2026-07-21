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

  console.log("[NGINX] Attempting to remove:", configFile);

  try {
    await fs.unlink(configFile);
    console.log("[NGINX] Removed:", configFile);
  } catch (error) {
    console.error("[NGINX] Failed removing:", configFile, error);
    throw error;
  }
}