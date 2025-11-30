import { prisma } from '../utils/database';

async function addKidsServicesCategory() {
  try {
    console.log('🔄 Adding KIDS_SERVICES to ServiceCategory enum...');
    
    // Execute raw SQL to add the enum value
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'KIDS_SERVICES' 
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ServiceCategory')
        ) THEN
          ALTER TYPE "ServiceCategory" ADD VALUE 'KIDS_SERVICES';
        END IF;
      END $$;
    `);
    
    console.log('✅ KIDS_SERVICES category added successfully!');
    
    // Verify it was added
    const result = await prisma.$queryRawUnsafe(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ServiceCategory')
      ORDER BY enumsortorder;
    `);
    
    console.log('📋 Available categories:', result);
    
  } catch (error: any) {
    console.error('❌ Error adding KIDS_SERVICES category:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  addKidsServicesCategory();
}

export { addKidsServicesCategory };

