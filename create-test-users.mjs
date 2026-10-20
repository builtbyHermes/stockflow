import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const users = [
  {
    name: "StockFlow Test Admin",
    email: "admin.test@stockflow.local",
    password: "StockFlowAdmin2026!",
    role: "ADMIN",
  },
  {
    name: "StockFlow Test User",
    email: "user.test@stockflow.local",
    password: "StockFlowUser2026!",
    role: "STAFF",
  },
];

try {
  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 12);

    const savedUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        passwordHash,
        role: user.role,
      },
      create: {
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    console.log("Saved account:", savedUser);
  }
} catch (error) {
  console.error("Failed to create accounts:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
