import { runDeploymentWorker } from "@/workers/deploymentWorker";

async function main() {
  console.log("Deployment worker started");

  await runDeploymentWorker();

  console.log("Deployment worker stopped");
}

main()
  .catch((error) => {
    console.error("Worker crashed", error);
    process.exit(1);
  });
