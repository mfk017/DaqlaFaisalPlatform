const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.profile.findMany();
  console.log(users.map(u => ({ email: u.email })));
}

run();
