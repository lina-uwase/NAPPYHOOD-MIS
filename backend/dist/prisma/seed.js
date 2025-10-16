"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seeding...');
    // Create default admin user only
    const hashedPassword = await bcryptjs_1.default.hash('admin123', 10);
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
            category: client_1.ServiceCategory.HAIR_TREATMENTS,
            description: 'Relax and refresh with our Shampoo package — includes onion oil massage, pre-poo treatment, detangling, leave-in conditioner, scalp oil, hair butter, blow-dry, and your choice of a simple hair bun or two simple cornrows!',
            singlePrice: 7000,
            combinedPrice: null,
            childPrice: 9000,
            childCombinedPrice: null,
        },
        {
            name: 'Braids Wash',
            category: client_1.ServiceCategory.HAIR_TREATMENTS,
            description: 'Refresh your braids with our Braids Wash, including onion oil massage, scalp oil, hair butter, and drying for healthy, nourished hair.',
            singlePrice: 9000,
            combinedPrice: null,
            childPrice: 12000,
            childCombinedPrice: null,
        },
        {
            name: 'Protein Treatment',
            category: client_1.ServiceCategory.HAIR_TREATMENTS,
            description: 'Give your 4C hair the care it deserves with our Protein Steam Treatment - it strengthens your 4C hair, rebuilds weak and damaged strands, reduces breakage, and helps it grow healthier and thicker',
            singlePrice: 10000,
            combinedPrice: 15000,
            childPrice: 12000,
            childCombinedPrice: 17000,
        },
        {
            name: 'Hydration Deep Treatment',
            category: client_1.ServiceCategory.HAIR_TREATMENTS,
            description: 'Revive dry, dull hair with our Hydration Deep Conditioning Steam Treatment — it restores moisture, adds shine, and makes your hair soft and easy to manage!',
            singlePrice: 12000,
            combinedPrice: 17000,
            childPrice: 14000,
            childCombinedPrice: 19000,
        },
        {
            name: 'Fenugreek',
            category: client_1.ServiceCategory.HAIR_TREATMENTS,
            description: 'Got thin hair? This Treatment is designed to reduce hair fall, boost growth and volume, add shine, and leave your hair soft and nourished!',
            singlePrice: 10000,
            combinedPrice: 15000,
            childPrice: 12000,
            childCombinedPrice: 17000,
        },
        {
            name: 'No More Fall',
            category: client_1.ServiceCategory.HAIR_TREATMENTS,
            description: 'This powerful treatment targets hair fall, strengthens your roots, and helps keep your strands where they belong—on your head! Perfect for thinning or shedding hair.',
            singlePrice: 15000,
            combinedPrice: 20000,
            childPrice: 14000,
            childCombinedPrice: 22000,
        },
        {
            name: 'Bye Bye Dandruff',
            category: client_1.ServiceCategory.HAIR_TREATMENTS,
            description: 'Say goodbye to dry scalp! Our Dandruff Treatment soothes your scalp, reduces itchiness, and leaves your hair fresh, clean, and flake-free',
            singlePrice: 15000,
            combinedPrice: 20000,
            childPrice: 14000,
            childCombinedPrice: 22000,
        },
        {
            name: 'Hot Oil Treatment',
            category: client_1.ServiceCategory.HAIR_TREATMENTS,
            description: 'Refresh dry, thirsty hair instantly with our Hot Oil Treatment that adds deep moisture and natural shine!',
            singlePrice: 15000,
            combinedPrice: 20000,
            childPrice: 14000,
            childCombinedPrice: 22000,
        },
        {
            name: 'Henna Treatment',
            category: client_1.ServiceCategory.HAIR_TREATMENTS,
            description: 'Revive damaged and shedding hair with this ancient Indian secret—Henna coats your hair to make it stronger, less likely to break, and thicker over time!',
            singlePrice: 15000,
            combinedPrice: 20000,
            childPrice: 14000,
            childCombinedPrice: 22000,
        },
        {
            name: 'Kanta',
            category: client_1.ServiceCategory.HAIR_TREATMENTS,
            description: 'Traditional hair treatment for natural hair care',
            singlePrice: 6000,
            combinedPrice: 12000,
            childPrice: null,
            childCombinedPrice: null,
        },
        {
            name: 'Chebe Twist',
            category: client_1.ServiceCategory.HAIR_TREATMENTS,
            description: 'Traditional Chebe powder treatment with protective twisting',
            singlePrice: 15000,
            combinedPrice: 20000,
            childPrice: null,
            childCombinedPrice: null,
        },
        {
            name: 'Hair Coloring (Teinture)',
            category: client_1.ServiceCategory.HAIR_TREATMENTS,
            description: 'Professional hair coloring service',
            singlePrice: 15000,
            combinedPrice: null,
            childPrice: null,
            childCombinedPrice: null,
        },
        // TWIST HAIRSTYLES
        {
            name: 'Normal Twist',
            category: client_1.ServiceCategory.TWIST_HAIRSTYLE,
            description: 'Classic protective twisting style',
            singlePrice: 12000,
            combinedPrice: 15000,
            childPrice: 12000,
            childCombinedPrice: 17000,
        },
        {
            name: 'Small Size Twist',
            category: client_1.ServiceCategory.TWIST_HAIRSTYLE,
            description: 'Small detailed protective twists',
            singlePrice: 20000,
            combinedPrice: 25000,
            childPrice: null,
            childCombinedPrice: null,
        },
        {
            name: 'Twist Out',
            category: client_1.ServiceCategory.TWIST_HAIRSTYLE,
            description: 'Twist out styling for natural curl definition',
            singlePrice: 15000,
            combinedPrice: 20000,
            childPrice: null,
            childCombinedPrice: null,
        },
        {
            name: 'Twist with Extension',
            category: client_1.ServiceCategory.TWIST_HAIRSTYLE,
            description: 'Protective twists with hair extensions for length and volume',
            singlePrice: 40000,
            combinedPrice: 45000,
            childPrice: null,
            childCombinedPrice: null,
        },
        {
            name: 'Flat Twist with Extension',
            category: client_1.ServiceCategory.TWIST_HAIRSTYLE,
            description: 'Flat twist styling with extensions',
            singlePrice: 15000,
            combinedPrice: 20000,
            childPrice: null,
            childCombinedPrice: null,
        },
        // CORNROWS BRAIDS
        {
            name: 'Two Lines Cornrows',
            category: client_1.ServiceCategory.CORNROWS_BRAIDS,
            description: 'Simple two-line cornrow style',
            singlePrice: 7000,
            combinedPrice: 12000,
            childPrice: null,
            childCombinedPrice: null,
        },
        {
            name: 'Three Lines Cornrows',
            category: client_1.ServiceCategory.CORNROWS_BRAIDS,
            description: 'Three-line cornrow style',
            singlePrice: 9000,
            combinedPrice: 14000,
            childPrice: null,
            childCombinedPrice: null,
        },
        {
            name: 'Four Lines Cornrows',
            category: client_1.ServiceCategory.CORNROWS_BRAIDS,
            description: 'Four-line cornrow style',
            singlePrice: 10000,
            combinedPrice: 15000,
            childPrice: null,
            childCombinedPrice: null,
        },
        {
            name: 'Five Lines Cornrows',
            category: client_1.ServiceCategory.CORNROWS_BRAIDS,
            description: 'Five-line cornrow style',
            singlePrice: 12000,
            combinedPrice: 17000,
            childPrice: null,
            childCombinedPrice: null,
        },
        {
            name: 'Six to Eight Lines Cornrows',
            category: client_1.ServiceCategory.CORNROWS_BRAIDS,
            description: 'Medium complexity cornrow style (6-8 lines)',
            singlePrice: 15000,
            combinedPrice: 20000,
            childPrice: null,
            childCombinedPrice: null,
        },
        {
            name: 'Nine to Twelve Lines Cornrows',
            category: client_1.ServiceCategory.CORNROWS_BRAIDS,
            description: 'Complex cornrow style (9-12 lines)',
            singlePrice: 18000,
            combinedPrice: 24000,
            childPrice: null,
            childCombinedPrice: null,
        },
        {
            name: 'Cornrows for Wig',
            category: client_1.ServiceCategory.CORNROWS_BRAIDS,
            description: 'Cornrows styled specifically for wig application',
            singlePrice: 10000,
            combinedPrice: 16000,
            childPrice: null,
            childCombinedPrice: null,
        },
        {
            name: 'Men Cornrows',
            category: client_1.ServiceCategory.CORNROWS_BRAIDS,
            description: 'Cornrow styling for men',
            singlePrice: 7000,
            combinedPrice: 14000,
            childPrice: null,
            childCombinedPrice: null,
        },
        // STRAWSET & CURLS
        {
            name: 'Big Strawset',
            category: client_1.ServiceCategory.STRAWSET_CURLS,
            description: 'Large curl pattern strawset styling',
            singlePrice: 10000,
            combinedPrice: 15000,
            childPrice: null,
            childCombinedPrice: null,
        },
        {
            name: 'Small Strawset',
            category: client_1.ServiceCategory.STRAWSET_CURLS,
            description: 'Small curl pattern strawset styling',
            singlePrice: 15000,
            combinedPrice: 20000,
            childPrice: null,
            childCombinedPrice: null,
        },
        {
            name: 'Flexroad/Imiheha',
            category: client_1.ServiceCategory.STRAWSET_CURLS,
            description: 'Traditional Rwandan curl styling technique',
            singlePrice: 20000,
            combinedPrice: 25000,
            childPrice: null,
            childCombinedPrice: null,
        },
        {
            name: 'Fingerlocs',
            category: client_1.ServiceCategory.STRAWSET_CURLS,
            description: 'Finger-coiled loc styling',
            singlePrice: 20000,
            combinedPrice: 25000,
            childPrice: null,
            childCombinedPrice: null,
        },
        // STYLING SERVICES
        {
            name: 'Styling without Extension',
            category: client_1.ServiceCategory.STYLING_SERVICE,
            description: 'General hair styling without extensions',
            singlePrice: 7000,
            combinedPrice: 12000,
            childPrice: null,
            childCombinedPrice: null,
        },
        {
            name: 'Styling with Extension',
            category: client_1.ServiceCategory.STYLING_SERVICE,
            description: 'Hair styling with extensions',
            singlePrice: 10000,
            combinedPrice: 15000,
            childPrice: null,
            childCombinedPrice: null,
        },
        {
            name: 'Braids & Dreadlocks',
            category: client_1.ServiceCategory.STYLING_SERVICE,
            description: 'Protective braiding and dreadlock maintenance',
            singlePrice: 9000,
            combinedPrice: 15000,
            childPrice: null,
            childCombinedPrice: null,
        },
        {
            name: 'Bride Styling',
            category: client_1.ServiceCategory.STYLING_SERVICE,
            description: 'Special bridal hair styling',
            singlePrice: 20000,
            combinedPrice: 25000,
            childPrice: null,
            childCombinedPrice: null,
        },
        {
            name: 'Silk Press (Flat, Trim)',
            category: client_1.ServiceCategory.STYLING_SERVICE,
            description: 'Professional silk press with trimming',
            singlePrice: 10000,
            combinedPrice: 15000,
            childPrice: null,
            childCombinedPrice: null,
        },
        {
            name: 'Blow Drying',
            category: client_1.ServiceCategory.STYLING_SERVICE,
            description: 'Professional blow dry service',
            singlePrice: 3000,
            combinedPrice: null,
            childPrice: null,
            childCombinedPrice: null,
        },
        // SPECIAL OFFERS
        {
            name: 'DIY Treatment/Kanta Service',
            category: client_1.ServiceCategory.SPECIAL_OFFERS,
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
    // Create sample customers
    const sampleCustomers = [
        {
            fullName: 'Marie Claire Uwimana',
            gender: client_1.Gender.FEMALE,
            location: 'Nyamirambo',
            district: 'Nyarugenge',
            province: 'Kigali City',
            phone: '+250788444444',
            email: 'marie@example.com',
            birthDay: 15,
            birthMonth: 3,
            birthYear: 1990
        },
        {
            fullName: 'Grace Mukamana',
            gender: client_1.Gender.FEMALE,
            location: 'Karuruma',
            district: 'Kicukiro',
            province: 'Kigali City',
            phone: '+250788555555',
            email: null,
            birthDay: 22,
            birthMonth: 7,
            birthYear: 1985
        },
        {
            fullName: 'Divine Uwase',
            gender: client_1.Gender.FEMALE,
            location: 'Kimironko',
            district: 'Gasabo',
            province: 'Kigali City',
            phone: '+250788666666',
            email: 'divine@example.com',
            birthDay: 10,
            birthMonth: 12,
            birthYear: 1995
        }
    ];
    for (const customer of sampleCustomers) {
        await prisma.customer.create({
            data: customer
        });
    }
    console.log('✅ Created sample customers');
    // Create sample sales
    const shampooService = await prisma.service.findUnique({
        where: { name: 'Shampoo' }
    });
    const proteinTreatmentService = await prisma.service.findUnique({
        where: { name: 'Protein Treatment' }
    });
    if (shampooService && proteinTreatmentService) {
        // Get customers for creating sales
        const customers = await prisma.customer.findMany({
            take: 3
        });
        if (customers.length > 0) {
            // Create sample sales
            const sampleSales = [
                {
                    customerId: customers[0].id,
                    totalAmount: 17000,
                    discountAmount: 0,
                    finalAmount: 17000,
                    loyaltyPointsEarned: 17,
                    notes: 'Regular customer visit',
                    isCompleted: true,
                    createdById: adminUser.id,
                    services: [
                        {
                            serviceId: shampooService.id,
                            quantity: 1,
                            unitPrice: 7000,
                            totalPrice: 7000,
                            isChild: false,
                            isCombined: false
                        },
                        {
                            serviceId: proteinTreatmentService.id,
                            quantity: 1,
                            unitPrice: 10000,
                            totalPrice: 10000,
                            isChild: false,
                            isCombined: false
                        }
                    ]
                },
                {
                    customerId: customers[1].id,
                    totalAmount: 7000,
                    discountAmount: 1400, // 20% birthday discount
                    finalAmount: 5600,
                    loyaltyPointsEarned: 7,
                    notes: 'Birthday month discount applied',
                    isCompleted: true,
                    createdById: adminUser.id,
                    birthMonthDiscount: true,
                    services: [
                        {
                            serviceId: shampooService.id,
                            quantity: 1,
                            unitPrice: 7000,
                            totalPrice: 7000,
                            isChild: false,
                            isCombined: false
                        }
                    ]
                },
                {
                    customerId: customers[2].id,
                    totalAmount: 15000,
                    discountAmount: 0,
                    finalAmount: 15000,
                    loyaltyPointsEarned: 15,
                    notes: 'Protein treatment with combination pricing',
                    isCompleted: true,
                    createdById: adminUser.id,
                    services: [
                        {
                            serviceId: proteinTreatmentService.id,
                            quantity: 1,
                            unitPrice: 15000,
                            totalPrice: 15000,
                            isChild: false,
                            isCombined: true
                        }
                    ]
                }
            ];
            for (const saleData of sampleSales) {
                const { services, ...saleInfo } = saleData;
                const sale = await prisma.sale.create({
                    data: saleInfo
                });
                // Create sale services
                for (const serviceData of services) {
                    await prisma.saleService.create({
                        data: {
                            saleId: sale.id,
                            ...serviceData
                        }
                    });
                }
                // Create sale staff assignment
                await prisma.saleStaff.create({
                    data: {
                        saleId: sale.id,
                        staffId: adminUser.id
                    }
                });
            }
            // Update customer stats
            for (const customer of customers) {
                const customerSales = await prisma.sale.findMany({
                    where: { customerId: customer.id, isCompleted: true }
                });
                const totalSpent = customerSales.reduce((sum, sale) => sum + Number(sale.finalAmount), 0);
                const saleCount = customerSales.length;
                const lastSale = customerSales.length > 0 ? customerSales[customerSales.length - 1].saleDate : null;
                await prisma.customer.update({
                    where: { id: customer.id },
                    data: {
                        totalSpent,
                        saleCount,
                        lastSale
                    }
                });
            }
            console.log('✅ Created sample sales');
        }
    }
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
//# sourceMappingURL=seed.js.map