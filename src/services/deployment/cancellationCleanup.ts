import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function cleanupCancelledDeployment(
  containerName?: string,
  imageName?: string
) {

  try {

    if (containerName) {

      await execAsync(
        `docker rm -f ${containerName}`
      );

      console.log(
        `[CLEANUP] Removed container ${containerName}`
      );
    }


    if (imageName) {

      await execAsync(
        `docker rmi -f ${imageName}`
      );

      console.log(
        `[CLEANUP] Removed image ${imageName}`
      );
    }


  } catch (error) {

    console.error(
      "[CLEANUP] Failed",
      error
    );

  }
}