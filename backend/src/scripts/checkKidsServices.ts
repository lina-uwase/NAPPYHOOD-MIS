import { prisma } from '../utils/database';
import { ServiceCategory } from '@prisma/client';

async function checkKidsServices() {
  try {
    const kidsServices = await prisma.service.findMany({
      where: { category: ServiceCategory.KIDS_SERVICES },
      select: {
        id: true,
        name: true,
        category: true,
        isActive: true,
        singlePrice: true
      }
    });
    
    console.log(`\n📊 Found ${kidsServices.length} kids services in database:\n`);
    kidsServices.forEach((service, index) => {
      console.log(`${index + 1}. ${service.name} - Category: ${service.category}, Active: ${service.isActive}, Price: ${service.singlePrice}`);
    });
    
    const activeKidsServices = kidsServices.filter(s => s.isActive);
    console.log(`\n✅ Active kids services: ${activeKidsServices.length}`);
    console.log(`⚠️  Inactive kids services: ${kidsServices.length - activeKidsServices.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkKidsServices();

