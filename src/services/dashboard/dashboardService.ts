import { projectRepository } from "@/repositories/projectRepository";
import { deploymentRepository } from "@/repositories/deploymentRepository";
import { userRepository } from "@/repositories/userRepository";
import { clusterRepository } from "@/repositories/clusterRepository";

export const dashboardService = {
  /**
   * Retrieves aggregate counts for the dashboard overview.
   */
  async getOverview() {
    const [
      projects,
      deployments,
      users,
      clusters,
    ] = await Promise.all([
      projectRepository.count(),
      deploymentRepository.count(),
      userRepository.count(),
      clusterRepository.count(),
    ]);

    return {
      projects,
      deployments,
      users,
      clusters,
    };
  },
};