const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const services = [
    {
      name: "CURLS",
      category: "Strawset & Curls",
      singlePrice: 15000,
      isActive: true
    },
    {
      name: "STRAWSET",
      category: "Strawset & Curls",
      singlePrice: 10000,
      isActive: true
    },
    {
      name: "DREADLOCKS RETWIST",
      category: "Locs",
      singlePrice: 20000,
      isActive: true
    },
    {
      name: "HAIR CUT",
      category: "Haircuts & Styling",
      singlePrice: 5000,
      isActive: true
    }
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: {},
      create: service
    });
  }
  
  console.log('Seed created additional services.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
