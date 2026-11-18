import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("Usage: npx tsx scripts/create-user.ts <username> <password>");
    process.exit(1);
  }

  const [username, password] = args;

  if (!username || !password) {
    console.error("Username and password are required");
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
      },
    });

    console.log(`User created successfully: ${user.username}`);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      console.error(`User with username "${username}" already exists`);
    } else {
      console.error("Error creating user:", error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
