import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma";

async function main() {
  const passwordHash = await bcrypt.hash(
    "Admin@123",
    10
  );

  const user = await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@opspilot.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(user);
}

main();