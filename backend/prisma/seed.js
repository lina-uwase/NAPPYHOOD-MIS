const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@nappyhood.com' },
    update: {},
    create: {
      email: 'admin@nappyhood.com',
      name: 'Admin User',
      password: hashedPassword,
      phone: '+250123456789',
      role: 'ADMIN',
    },
  });
  console.log('Seed created admin user.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
