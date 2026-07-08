import { prisma } from "@/lib/prisma";

export const dashboardService = {

  async getOverview() {

    const [
      projects,
      deployments,
      users,
      clusters,
    ] = await Promise.all([
      prisma.project.count(),

      prisma.deployment.count(),

      prisma.user.count(),

      prisma.cluster.count(),
    ]);


    return {
      projects,
      deployments,
      users,
      clusters,
    };
  },
};