const { PrismaClient, ServiceCategory, Gender } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default admin user only
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.upsert({
    where: { phone: '0788456312' },
    update: {},
    create: {
      name: 'Nappyhood Admin',
      email: 'Nappyhood.boutique@gmail.com',
      password: hashedPassword,
      role: 'ADMIN',
      phone: '0788456312'
    }
  });

  console.log('✅ Created admin user');

  // Create discount rules
  const discountRules = await Promise.all([
    prisma.discountRule.upsert({
      where: { name: 'Sixth Sale Discount' },
      update: {},
      create: {
        name: 'Sixth Sale Discount',
        type: 'SIXTH_VISIT',
        value: 20,
        isPercentage: true,
        description: '20% discount on every 6th sale'
      }
    }),
    prisma.discountRule.upsert({
      where: { name: 'Birthday Month Discount' },
      update: {},
      create: {
        name: 'Birthday Month Discount',
        type: 'BIRTHDAY_MONTH',
        value: 20,
        isPercentage: true,
        description: '20% discount during birthday month'
      }
    }),
    prisma.discountRule.upsert({
      where: { name: 'Service Combo Discount' },
      update: {},
      create: {
        name: 'Service Combo Discount',
        type: 'SERVICE_COMBO',
        value: 20.00,
        isPercentage: false,
        description: '2000 RWF off when combining shampoo with other services'
      }
    }),
    prisma.discountRule.upsert({
      where: { name: 'Bring Own Product Discount' },
      update: {},
      create: {
        name: 'Bring Own Product Discount',
        type: 'BRING_OWN_PRODUCT',
        value: 10.00,
        isPercentage: false,
        description: '1000 RWF off when bringing your own products'
      }
    })
  ]);

  console.log('✅ Created discount rules');

  // Create all Nappyhood services
  const services = [
    // HAIR TREATMENTS
    {
      name: 'Shampoo',
      category: ServiceCategory.HAIR_TREATMENTS,
      description: 'Relax and refresh with our Shampoo package — includes onion oil massage, pre-poo treatment, detangling, leave-in conditioner, scalp oil, hair butter, blow-dry, and your choice of a simple hair bun or two simple cornrows!',
      singlePrice: 7000,
      combinedPrice: null,
      childPrice: 9000,
      childCombinedPrice: null,
    },
    {
      name: 'Braids Wash',
      category: ServiceCategory.HAIR_TREATMENTS,
      description: 'Refresh your braids with our Braids Wash, including onion oil massage, scalp oil, hair butter, and drying for healthy, nourished hair.',
      singlePrice: 9000,
      combinedPrice: null,
      childPrice: 12000,
      childCombinedPrice: null,
    },
    {
      name: 'Protein Treatment',
      category: ServiceCategory.HAIR_TREATMENTS,
      description: 'Give your 4C hair the care it deserves with our Protein Steam Treatment - it strengthens your 4C hair, rebuilds weak and damaged strands, reduces breakage, and helps it grow healthier and thicker',
      singlePrice: 10000,
      combinedPrice: 15000,
      childPrice: 12000,
      childCombinedPrice: 17000,
    },
    {
      name: 'Hydration Deep Treatment',
      category: ServiceCategory.HAIR_TREATMENTS,
      description: 'Revive dry, dull hair with our Hydration Deep Conditioning Steam Treatment — it restores moisture, adds shine, and makes your hair soft and easy to manage!',
      singlePrice: 12000,
      combinedPrice: 17000,
      childPrice: 14000,
      childCombinedPrice: 19000,
    },
    {
      name: 'Fenugreek',
      category: ServiceCategory.HAIR_TREATMENTS,
      description: 'Got thin hair? This Treatment is designed to reduce hair fall, boost growth and volume, add shine, and leave your hair soft and nourished!',
      singlePrice: 10000,
      combinedPrice: 15000,
      childPrice: 12000,
      childCombinedPrice: 17000,
    },
    {
      name: 'No More Fall',
      category: ServiceCategory.HAIR_TREATMENTS,
      description: 'This powerful treatment targets hair fall, strengthens your roots, and helps keep your strands where they belong—on your head! Perfect for thinning or shedding hair.',
      singlePrice: 15000,
      combinedPrice: 20000,
      childPrice: 14000,
      childCombinedPrice: 22000,
    },
    {
      name: 'Bye Bye Dandruff',
      category: ServiceCategory.HAIR_TREATMENTS,
      description: 'Say goodbye to dry scalp! Our Dandruff Treatment soothes your scalp, reduces itchiness, and leaves your hair fresh, clean, and flake-free',
      singlePrice: 15000,
      combinedPrice: 20000,
      childPrice: 14000,
      childCombinedPrice: 22000,
    },
    {
      name: 'Hot Oil Treatment',
      category: ServiceCategory.HAIR_TREATMENTS,
      description: 'Refresh dry, thirsty hair instantly with our Hot Oil Treatment that adds deep moisture and natural shine!',
      singlePrice: 15000,
      combinedPrice: 20000,
      childPrice: 14000,
      childCombinedPrice: 22000,
    },
    {
      name: 'Henna Treatment',
      category: ServiceCategory.HAIR_TREATMENTS,
      description: 'Revive damaged and shedding hair with this ancient Indian secret—Henna coats your hair to make it stronger, less likely to break, and thicker over time!',
      singlePrice: 15000,
      combinedPrice: 20000,
      childPrice: 14000,
      childCombinedPrice: 22000,
    },
    {
      name: 'Kanta',
      category: ServiceCategory.HAIR_TREATMENTS,
      description: 'Traditional hair treatment for natural hair care',
      singlePrice: 6000,
      combinedPrice: 12000,
      childPrice: null,
      childCombinedPrice: null,
    },
    {
      name: 'Chebe Twist',
      category: ServiceCategory.HAIR_TREATMENTS,
      description: 'Traditional Chebe powder treatment with protective twisting',
      singlePrice: 15000,
      combinedPrice: 20000,
      childPrice: null,
      childCombinedPrice: null,
    },
    {
      name: 'Hair Coloring (Teinture)',
      category: ServiceCategory.HAIR_TREATMENTS,
      description: 'Professional hair coloring service',
      singlePrice: 15000,
      combinedPrice: null,
      childPrice: null,
      childCombinedPrice: null,
    },

    // TWIST HAIRSTYLES
    {
      name: 'Normal Twist',
      category: ServiceCategory.TWIST_HAIRSTYLE,
      description: 'Classic protective twisting style',
      singlePrice: 12000,
      combinedPrice: 15000,
      childPrice: 12000,
      childCombinedPrice: 17000,
    },
    {
      name: 'Small Size Twist',
      category: ServiceCategory.TWIST_HAIRSTYLE,
      description: 'Small detailed protective twists',
      singlePrice: 20000,
      combinedPrice: 25000,
      childPrice: null,
      childCombinedPrice: null,
    },
    {
      name: 'Twist Out',
      category: ServiceCategory.TWIST_HAIRSTYLE,
      description: 'Twist out styling for natural curl definition',
      singlePrice: 15000,
      combinedPrice: 20000,
      childPrice: null,
      childCombinedPrice: null,
    },
    {
      name: 'Twist with Extension',
      category: ServiceCategory.TWIST_HAIRSTYLE,
      description: 'Protective twists with hair extensions for length and volume',
      singlePrice: 40000,
      combinedPrice: 45000,
      childPrice: null,
      childCombinedPrice: null,
    },
    {
      name: 'Flat Twist with Extension',
      category: ServiceCategory.TWIST_HAIRSTYLE,
      description: 'Flat twist styling with extensions',
      singlePrice: 15000,
      combinedPrice: 20000,
      childPrice: null,
      childCombinedPrice: null,
    },

    // CORNROWS BRAIDS
    {
      name: 'Two Lines Cornrows',
      category: ServiceCategory.CORNROWS_BRAIDS,
      description: 'Simple two-line cornrow style',
      singlePrice: 7000,
      combinedPrice: 12000,
      childPrice: null,
      childCombinedPrice: null,
    },
    {
      name: 'Three Lines Cornrows',
      category: ServiceCategory.CORNROWS_BRAIDS,
      description: 'Three-line cornrow style',
      singlePrice: 9000,
      combinedPrice: 14000,
      childPrice: null,
      childCombinedPrice: null,
    },
    {
      name: 'Four Lines Cornrows',
      category: ServiceCategory.CORNROWS_BRAIDS,
      description: 'Four-line cornrow style',
      singlePrice: 10000,
      combinedPrice: 15000,
      childPrice: null,
      childCombinedPrice: null,
    },
    {
      name: 'Five Lines Cornrows',
      category: ServiceCategory.CORNROWS_BRAIDS,
      description: 'Five-line cornrow style',
      singlePrice: 12000,
      combinedPrice: 17000,
      childPrice: null,
      childCombinedPrice: null,
    },
    {
      name: 'Six to Eight Lines Cornrows',
      category: ServiceCategory.CORNROWS_BRAIDS,
      description: 'Medium complexity cornrow style (6-8 lines)',
      singlePrice: 15000,
      combinedPrice: 20000,
      childPrice: null,
      childCombinedPrice: null,
    },
    {
      name: 'Nine to Twelve Lines Cornrows',
      category: ServiceCategory.CORNROWS_BRAIDS,
      description: 'Complex cornrow style (9-12 lines)',
      singlePrice: 18000,
      combinedPrice: 24000,
      childPrice: null,
      childCombinedPrice: null,
    },
    {
      name: 'Cornrows for Wig',
      category: ServiceCategory.CORNROWS_BRAIDS,
      description: 'Cornrows styled specifically for wig application',
      singlePrice: 10000,
      combinedPrice: 16000,
      childPrice: null,
      childCombinedPrice: null,
    },
    {
      name: 'Men Cornrows',
      category: ServiceCategory.CORNROWS_BRAIDS,
      description: 'Cornrow styling for men',
      singlePrice: 7000,
      combinedPrice: 14000,
      childPrice: null,
      childCombinedPrice: null,
    },

    // STRAWSET & CURLS
    {
      name: 'Big Strawset',
      category: ServiceCategory.STRAWSET_CURLS,
      description: 'Large curl pattern strawset styling',
      singlePrice: 10000,
      combinedPrice: 15000,
      childPrice: null,
      childCombinedPrice: null,
    },
    {
      name: 'Small Strawset',
      category: ServiceCategory.STRAWSET_CURLS,
      description: 'Small curl pattern strawset styling',
      singlePrice: 15000,
      combinedPrice: 20000,
      childPrice: null,
      childCombinedPrice: null,
    },
    {
      name: 'Flexroad/Imiheha',
      category: ServiceCategory.STRAWSET_CURLS,
      description: 'Traditional Rwandan curl styling technique',
      singlePrice: 20000,
      combinedPrice: 25000,
      childPrice: null,
      childCombinedPrice: null,
    },
    {
      name: 'Fingerlocs',
      category: ServiceCategory.STRAWSET_CURLS,
      description: 'Finger-coiled loc styling',
      singlePrice: 20000,
      combinedPrice: 25000,
      childPrice: null,
      childCombinedPrice: null,
    },

    // STYLING SERVICES
    {
      name: 'Styling without Extension',
      category: ServiceCategory.STYLING_SERVICE,
      description: 'General hair styling without extensions',
      singlePrice: 7000,
      combinedPrice: 12000,
      childPrice: null,
      childCombinedPrice: null,
    },
    {
      name: 'Styling with Extension',
      category: ServiceCategory.STYLING_SERVICE,
      description: 'Hair styling with extensions',
      singlePrice: 10000,
      combinedPrice: 15000,
      childPrice: null,
      childCombinedPrice: null,
    },
    {
      name: 'Braids & Dreadlocks',
      category: ServiceCategory.STYLING_SERVICE,
      description: 'Protective braiding and dreadlock maintenance',
      singlePrice: 9000,
      combinedPrice: 15000,
      childPrice: null,
      childCombinedPrice: null,
    },
    {
      name: 'Bride Styling',
      category: ServiceCategory.STYLING_SERVICE,
      description: 'Special bridal hair styling',
      singlePrice: 20000,
      combinedPrice: 25000,
      childPrice: null,
      childCombinedPrice: null,
    },
    {
      name: 'Silk Press (Flat, Trim)',
      category: ServiceCategory.STYLING_SERVICE,
      description: 'Professional silk press with trimming',
      singlePrice: 10000,
      combinedPrice: 15000,
      childPrice: null,
      childCombinedPrice: null,
    },
    {
      name: 'Blow Drying',
      category: ServiceCategory.STYLING_SERVICE,
      description: 'Professional blow dry service',
      singlePrice: 3000,
      combinedPrice: null,
      childPrice: null,
      childCombinedPrice: null,
    },

    // SPECIAL OFFERS
    {
      name: 'DIY Treatment/Kanta Service',
      category: ServiceCategory.SPECIAL_OFFERS,
      description: 'Do-it-yourself treatment guidance and Kanta service',
      singlePrice: 10000,
      combinedPrice: null,
      childPrice: null,
      childCombinedPrice: null,
    }
  ];

  // Create services
  for (const service of services) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: service,
      create: service
    });
  }

  console.log('✅ Created all Nappyhood salon services');

  console.log('🎉 Database seeding completed successfully!');

  console.log('\n📋 Default Admin Login:');
  console.log('Admin Phone: 0788456312');
  console.log('Admin Password: admin123');
  console.log('\n💡 Other users can be created through the admin panel with custom phone numbers');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });