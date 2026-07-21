import fs from "fs/promises";
import path from "path";

const TEMPLATE_FILE = path.resolve(
  process.cwd(),
  "src/services/proxy/templates/vhost.template"
);

const OUTPUT_DIRECTORY = path.resolve(
  process.cwd(),
  "nginx/conf.d"
);

async function ensureOutputDirectory(): Promise<void> {
  await fs.mkdir(OUTPUT_DIRECTORY, {
    recursive: true,
  });
}

export async function generateNginxConfig(
  deploymentId: string,
  networkAlias: string,
  domain: string
): Promise<string> {
  await ensureOutputDirectory();

  try {
    await fs.access(TEMPLATE_FILE);
  } catch {
    throw new Error(
      `Nginx template not found: ${TEMPLATE_FILE}`
    );
  }

  const template = await fs.readFile(
    TEMPLATE_FILE,
    "utf8"
  );

  console.log("[NGINX DEBUG]", {
  deploymentId,
  networkAlias,
  domain
});

const config = template
    .replace(/{{DOMAIN}}/g, domain)
    .replace(
  /{{NETWORK_ALIAS}}/g,
  networkAlias.trim()
);

  const output = path.resolve(
    OUTPUT_DIRECTORY,
    `${deploymentId}.conf`
  );

  await fs.writeFile(
    output,
    config,
    {
      encoding: "utf8",
      flush: true,
    }
  );

  console.log(
    `[NGINX] Generated config: ${output}`
  );

  return output;
}

export async function removeStaleConfigs(
  activeContainers: string[]
): Promise<void> {
  await ensureOutputDirectory();

  const files = await fs.readdir(
    OUTPUT_DIRECTORY
  );

  for (const file of files) {
    if (!file.endsWith(".conf")) {
      continue;
    }

    if (file === "default.conf") {
      continue;
    }

    const filePath = path.join(
      OUTPUT_DIRECTORY,
      file
    );

    const content = await fs.readFile(
      filePath,
      "utf8"
    );

    const isActive = activeContainers.some(
      (container) => content.includes(container)
    );

    if (!isActive) {
      await fs.unlink(filePath);

      console.log(
        `[NGINX] Removed stale config: ${file}`
      );
    }
  }
}