import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  const deployments = await prisma.deployment.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  console.log(JSON.stringify(deployments, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });