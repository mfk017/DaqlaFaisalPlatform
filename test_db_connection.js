const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.profile.findUnique({
      where: { email: 'testadmin@factory.com' },
      include: { roles: true }
    });
    console.log('User found:', user ? user.email : 'null');
  } catch (error) {
    console.error('Database Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}
main();
