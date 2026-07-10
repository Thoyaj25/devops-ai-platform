import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const ROOT = path.join(os.tmpdir(), "marketsphere", "deployments");

export const workspaceService = {
  /**
   * Returns the workspace path for a deployment.
   */
  getPath(deploymentId: string) {
    return path.join(ROOT, deploymentId);
  },

  /**
   * Creates a clean workspace.
   */
  async prepare(deploymentId: string) {
    const workspace = this.getPath(deploymentId);

    await fs.rm(workspace, {
      recursive: true,
      force: true,
    });

    await fs.mkdir(workspace, {
      recursive: true,
    });

    return workspace;
  },

  /**
   * Deletes the workspace.
   */
  async cleanup(deploymentId: string) {
    const workspace = this.getPath(deploymentId);

    await fs.rm(workspace, {
      recursive: true,
      force: true,
    });
  },
};