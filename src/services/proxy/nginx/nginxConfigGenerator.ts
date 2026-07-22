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

  if (!deploymentId?.trim()) {
    throw new Error("Deployment ID is required");
  }

  if (!networkAlias?.trim()) {
    throw new Error("Network alias is required");
  }

  if (!domain?.trim()) {
    throw new Error("Domain is required");
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


  try {

    await fs.access(
      TEMPLATE_FILE
    );

  } catch {

    throw new Error(
      `Nginx template not found: ${TEMPLATE_FILE}`
    );

  }


  const template =
    await fs.readFile(
      TEMPLATE_FILE,
      "utf8"
    );


  const normalizedAlias =
    networkAlias.trim();


  const normalizedDomain =
    domain.trim().toLowerCase();



  const config =
    template
      .replaceAll(
        "{{DOMAIN}}",
        normalizedDomain
      )
      .replaceAll(
        "{{NETWORK_ALIAS}}",
        normalizedAlias
      )
      .replaceAll(
        "{{CONTAINER_NAME}}",
        normalizedAlias
      );



  if (
    config.includes("{{")
  ) {

    throw new Error(
      "Generated nginx config contains unresolved template variables"
    );

  }



  const outputFile =
    path.join(
      OUTPUT_DIRECTORY,
      `${deploymentId}.conf`
    );


  await fs.writeFile(
    outputFile,
    config,
    "utf8"
  );


  console.log(
    "[NGINX] Generated config:",
    outputFile
  );


  console.log(
    "[NGINX DEBUG GENERATED]",
    {
      deploymentId,
      upstream: normalizedAlias,
      domain: normalizedDomain,
    }
  );


  return outputFile;
}



export async function removeStaleConfigs(
  activeContainers: string[]
): Promise<void> {


  await ensureOutputDirectory();


  const files =
    await fs.readdir(
      OUTPUT_DIRECTORY
    );


  for (const file of files) {


    if (
      !file.endsWith(".conf")
    ) {
      continue;
    }


    if (
      file === "default.conf"
    ) {
      continue;
    }


    const filePath =
      path.join(
        OUTPUT_DIRECTORY,
        file
      );


    const content =
      await fs.readFile(
        filePath,
        "utf8"
      );



    const active =
      activeContainers.some(
        (container) =>
          content.includes(container)
      );



    if (!active) {

      await fs.unlink(
        filePath
      );


      console.log(
        `[NGINX] Removed stale config: ${file}`
      );

    }

  }

}