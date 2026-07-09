import { prisma } from "@/lib/prisma";

export const clusterRepository = {
  /**
   * Returns the total count of clusters.
   */
  count() {
    return prisma.cluster.count();
  },

  // Add other cluster-related repository methods here as needed
  findAll() {
    return prisma.cluster.findMany({
      orderBy: { createdAt: "desc" },
    });
  },
};