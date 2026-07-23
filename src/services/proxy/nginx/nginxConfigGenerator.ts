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

function validateInput(
  deploymentId: string,
  networkAlias: string,
  domain: string
): void {
  if (!deploymentId.trim()) {
    throw new Error("Deployment ID required");
  }

  if (!networkAlias.trim()) {
    throw new Error("Network alias required");
  }

  if (!domain.trim()) {
    throw new Error("Domain required");
  }
}

export async function generateNginxConfig(
  deploymentId: string,
  networkAlias: string,
  domain: string
): Promise<string> {
  validateInput(
    deploymentId,
    networkAlias,
    domain
  );

  await ensureOutputDirectory();

  const template = await fs.readFile(
    TEMPLATE_FILE,
    "utf8"
  );

  const config = template
    .replaceAll(
      "{{DOMAIN}}",
      domain.trim().toLowerCase()
    )
    .replaceAll(
      "{{NETWORK_ALIAS}}",
      networkAlias.trim()
    )
    .replaceAll(
      "{{CONTAINER_NAME}}",
      networkAlias.trim()
    );

  if (config.includes("{{")) {
    throw new Error(
      "Unresolved nginx template variables"
    );
  }

  const outputFile = path.join(
    OUTPUT_DIRECTORY,
    `${deploymentId}.conf`
  );

  await fs.writeFile(
    outputFile,
    config,
    "utf8"
  );

  console.log(
    `[NGINX] created ${outputFile}`
  );

  return outputFile;
}

export async function removeStaleConfigs(
  activeDeploymentIds: string[]
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

    const deploymentId = file.replace(
      ".conf",
      ""
    );

    if (!activeDeploymentIds.includes(deploymentId)) {
      await fs.unlink(
        path.join(
          OUTPUT_DIRECTORY,
          file
        )
      );

      console.log(
        `[NGINX CLEANUP] removed ${file}`
      );
    }
  }
}