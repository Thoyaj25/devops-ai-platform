import "dotenv/config";
import { deploymentGarbageCollector } from "@/services/deployment/deploymentGarbageCollector";

async function main() {
  await deploymentGarbageCollector.collect();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });