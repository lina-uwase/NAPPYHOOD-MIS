const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  try {
    // Find users with Lina's info
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: 'u.lina250@gmail.com' },
          { phone: '+250791762689' }
        ]
      }
    });

    console.log('Found users:', users);

    // Delete them completely
    for (const user of users) {
      await prisma.user.delete({
        where: { id: user.id }
      });
      console.log(`Deleted user: ${user.name} (${user.email})`);
    }

    console.log('Cleanup complete!');
  } catch (error) {
    console.error('Cleanup error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();