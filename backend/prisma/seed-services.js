const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const services = [
    {
      name: "BRAIDS WASH",
      category: "Hair Treatments",
      singlePrice: 9000,
      childPrice: 12000,
      isActive: true
    },
    {
      name: "BYE BYE DANDRUFF",
      category: "Hair Treatments",
      singlePrice: 15000,
      combinedPrice: 20000,
      childPrice: 14000,
      isActive: true
    },
    {
      name: "CHEBE TWIST",
      category: "Hair Treatments",
      singlePrice: 15000,
      combinedPrice: 20000,
      isActive: true
    },
    {
      name: "Detangle",
      category: "Hair Treatments",
      singlePrice: 2000,
      isActive: true
    },
    {
      name: "Detangling for Imiheha/old twist",
      category: "Hair Treatments",
      singlePrice: 3000,
      isActive: true
    },
    {
      name: "FENUGREEK",
      category: "Hair Treatments",
      singlePrice: 10000,
      combinedPrice: 15000,
      childPrice: 12000,
      isActive: true
    },
    {
      name: "HAIR COLORING (TEINTURE)",
      category: "Hair Treatments",
      singlePrice: 15000,
      combinedPrice: 15000,
      isActive: true
    },
    {
      name: "HAIR SOFTENING TREATMENT",
      category: "Hair Treatments",
      singlePrice: 20000,
      combinedPrice: 25000,
      isActive: true
    },
    {
      name: "HENNA TREATMENT",
      category: "Hair Treatments",
      singlePrice: 15000,
      combinedPrice: 20000,
      childPrice: 14000,
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
  
  console.log('Seed created services.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
