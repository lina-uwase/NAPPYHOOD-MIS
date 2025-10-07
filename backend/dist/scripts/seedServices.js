"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nappyhoodServices = void 0;
exports.seedServices = seedServices;
const database_1 = require("../utils/database");
const client_1 = require("@prisma/client");
const nappyhoodServices = [
    // HAIR TREATMENTS
    {
        name: "SHAMPOO",
        category: client_1.ServiceCategory.HAIR_TREATMENTS,
        description: "Relax and refresh with our Shampoo package — includes onion oil massage, pre-poo treatment, detangling, leave-in conditioner, scalp oil, hair butter, blow-dry, and your choice of a simple hair bun or two simple cornrows!",
        singlePrice: 7000,
        combinedPrice: null,
        childPrice: 9000,
        childCombinedPrice: null,
    },
    {
        name: "BRAIDS WASH",
        category: client_1.ServiceCategory.HAIR_TREATMENTS,
        description: "Refresh your braids with our Braids Wash, including onion oil massage, scalp oil, hair butter, and drying for healthy, nourished hair.",
        singlePrice: 9000,
        combinedPrice: null,
        childPrice: 12000,
        childCombinedPrice: null,
    },
    {
        name: "PROTEIN TREATMENT",
        category: client_1.ServiceCategory.HAIR_TREATMENTS,
        description: "Give your 4C hair the care it deserves with our Protein Steam Treatment - it strengthens your 4C hair, rebuilds weak and damaged strands, reduces breakage, and helps it grow healthier and thicker",
        singlePrice: 10000,
        combinedPrice: 15000,
        childPrice: 12000,
        childCombinedPrice: 17000,
    },
    {
        name: "HYDRATION DEEP TREATMENT",
        category: client_1.ServiceCategory.HAIR_TREATMENTS,
        description: "Revive dry, dull hair with our Hydration Deep Conditioning Steam Treatment — it restores moisture, adds shine, and makes your hair soft and easy to manage!",
        singlePrice: 12000,
        combinedPrice: 17000,
        childPrice: 14000,
        childCombinedPrice: 19000,
    },
    {
        name: "FENUGREEK",
        category: client_1.ServiceCategory.HAIR_TREATMENTS,
        description: "Got thin hair? This Treatment is designed to reduce hair fall, boost growth and volume, add shine, and leave your hair soft and nourished!",
        singlePrice: 10000,
        combinedPrice: 15000,
        childPrice: 12000,
        childCombinedPrice: 17000,
    },
    {
        name: "NO MORE FALL",
        category: client_1.ServiceCategory.HAIR_TREATMENTS,
        description: "This powerful treatment targets hair fall, strengthens your roots, and helps keep your strands where they belong—on your head! Perfect for thinning or shedding hair.",
        singlePrice: 15000,
        combinedPrice: 20000,
        childPrice: 14000,
        childCombinedPrice: 22000,
    },
    {
        name: "BYE BYE DANDRUFF",
        category: client_1.ServiceCategory.HAIR_TREATMENTS,
        description: "Say goodbye to dry scalp! Our Dandruff Treatment soothes your scalp, reduces itchiness, and leaves your hair fresh, clean, and flake-free",
        singlePrice: 15000,
        combinedPrice: 20000,
        childPrice: 14000,
        childCombinedPrice: 22000,
    },
    {
        name: "HOT OIL TREATMENT",
        category: client_1.ServiceCategory.HAIR_TREATMENTS,
        description: "Refresh dry, thirsty hair instantly with our Hot Oil Treatment that adds deep moisture and natural shine!",
        singlePrice: 15000,
        combinedPrice: 20000,
        childPrice: 14000,
        childCombinedPrice: 22000,
    },
    {
        name: "HENNA TREATMENT",
        category: client_1.ServiceCategory.HAIR_TREATMENTS,
        description: "Revive damaged and shedding hair with this ancient Indian secret—Henna coats your hair to make it stronger, less likely to break, and thicker over time!",
        singlePrice: 15000,
        combinedPrice: 20000,
        childPrice: 14000,
        childCombinedPrice: 22000,
    },
    {
        name: "KANTA",
        category: client_1.ServiceCategory.HAIR_TREATMENTS,
        description: "Traditional hair care treatment with natural ingredients",
        singlePrice: 6000,
        combinedPrice: 12000,
        childPrice: null,
        childCombinedPrice: null,
    },
    {
        name: "CHEBE TWIST",
        category: client_1.ServiceCategory.HAIR_TREATMENTS,
        description: "Traditional African hair treatment using Chebe powder for hair growth and strength",
        singlePrice: 15000,
        combinedPrice: 20000,
        childPrice: null,
        childCombinedPrice: null,
    },
    {
        name: "HAIR COLORING (Teinture)",
        category: client_1.ServiceCategory.HAIR_TREATMENTS,
        description: "Professional hair coloring service with quality products",
        singlePrice: 15000,
        combinedPrice: null,
        childPrice: null,
        childCombinedPrice: null,
    },
    // TWIST HAIRSTYLE
    {
        name: "NORMAL TWIST",
        category: client_1.ServiceCategory.TWIST_HAIRSTYLE,
        description: "Classic natural hair twisting style",
        singlePrice: 12000,
        combinedPrice: 15000,
        childPrice: 12000,
        childCombinedPrice: 17000,
    },
    {
        name: "SMALL SIZE TWIST",
        category: client_1.ServiceCategory.TWIST_HAIRSTYLE,
        description: "Detailed small-sized twists for a refined look",
        singlePrice: 20000,
        combinedPrice: 25000,
        childPrice: null,
        childCombinedPrice: null,
    },
    {
        name: "TWIST OUT",
        category: client_1.ServiceCategory.TWIST_HAIRSTYLE,
        description: "Beautiful twist-out style for natural texture enhancement",
        singlePrice: 15000,
        combinedPrice: 20000,
        childPrice: null,
        childCombinedPrice: null,
    },
    {
        name: "TWIST WITH EXTENSION",
        category: client_1.ServiceCategory.TWIST_HAIRSTYLE,
        description: "Protective twist style using hair extensions for length and volume",
        singlePrice: 40000,
        combinedPrice: 45000,
        childPrice: null,
        childCombinedPrice: null,
    },
    {
        name: "FLAT TWIST WITH EXTENSION",
        category: client_1.ServiceCategory.TWIST_HAIRSTYLE,
        description: "Sleek flat twist style with extensions",
        singlePrice: 15000,
        combinedPrice: 20000,
        childPrice: null,
        childCombinedPrice: null,
    },
    // CORNROWS BRAIDS
    {
        name: "TWO LINES CORNROWS",
        category: client_1.ServiceCategory.CORNROWS_BRAIDS,
        description: "Simple two-line cornrow style",
        singlePrice: 7000,
        combinedPrice: 12000,
        childPrice: null,
        childCombinedPrice: null,
    },
    {
        name: "THREE LINES CORNROWS",
        category: client_1.ServiceCategory.CORNROWS_BRAIDS,
        description: "Classic three-line cornrow style",
        singlePrice: 9000,
        combinedPrice: 14000,
        childPrice: null,
        childCombinedPrice: null,
    },
    {
        name: "FOUR LINES CORNROWS",
        category: client_1.ServiceCategory.CORNROWS_BRAIDS,
        description: "Four-line cornrow braiding pattern",
        singlePrice: 10000,
        combinedPrice: 15000,
        childPrice: null,
        childCombinedPrice: null,
    },
    {
        name: "FIVE LINES CORNROWS",
        category: client_1.ServiceCategory.CORNROWS_BRAIDS,
        description: "Five-line cornrow pattern for detailed styling",
        singlePrice: 12000,
        combinedPrice: 17000,
        childPrice: null,
        childCombinedPrice: null,
    },
    {
        name: "6 TO 8 LINES CORNROWS",
        category: client_1.ServiceCategory.CORNROWS_BRAIDS,
        description: "Medium complexity cornrow styling with 6-8 lines",
        singlePrice: 15000,
        combinedPrice: 20000,
        childPrice: null,
        childCombinedPrice: null,
    },
    {
        name: "9 TO 12 LINES CORNROWS",
        category: client_1.ServiceCategory.CORNROWS_BRAIDS,
        description: "Complex cornrow pattern with 9-12 lines",
        singlePrice: 18000,
        combinedPrice: 24000,
        childPrice: null,
        childCombinedPrice: null,
    },
    {
        name: "CORNROWS FOR WIG",
        category: client_1.ServiceCategory.CORNROWS_BRAIDS,
        description: "Protective cornrow base for wig installation",
        singlePrice: 10000,
        combinedPrice: 16000,
        childPrice: null,
        childCombinedPrice: null,
    },
    {
        name: "MEN CORNROWS",
        category: client_1.ServiceCategory.CORNROWS_BRAIDS,
        description: "Cornrow styling specifically for men",
        singlePrice: 7000,
        combinedPrice: 14000,
        childPrice: null,
        childCombinedPrice: null,
    },
    // STRAWSET & CURLS
    {
        name: "BIG CURLS",
        category: client_1.ServiceCategory.STRAWSET_CURLS,
        description: "Large, voluminous curls using straw set technique",
        singlePrice: 10000,
        combinedPrice: 15000,
        childPrice: null,
        childCombinedPrice: null,
    },
    {
        name: "SMALL CURLS",
        category: client_1.ServiceCategory.STRAWSET_CURLS,
        description: "Tight, defined curls for detailed texture",
        singlePrice: 15000,
        combinedPrice: 20000,
        childPrice: null,
        childCombinedPrice: null,
    },
    {
        name: "FLEXROAD/IMIHEHA",
        category: client_1.ServiceCategory.STRAWSET_CURLS,
        description: "Traditional Rwandan curl styling technique",
        singlePrice: 20000,
        combinedPrice: 25000,
        childPrice: null,
        childCombinedPrice: null,
    },
    {
        name: "FINGERLOCS",
        category: client_1.ServiceCategory.STRAWSET_CURLS,
        description: "Hand-twisted locs for natural texture",
        singlePrice: 20000,
        combinedPrice: 25000,
        childPrice: null,
        childCombinedPrice: null,
    },
    // STYLING SERVICE
    {
        name: "STYLING NO EXTENSION",
        category: client_1.ServiceCategory.STYLING_SERVICE,
        description: "Natural hair styling without extensions",
        singlePrice: 7000,
        combinedPrice: 12000,
        childPrice: null,
        childCombinedPrice: null,
    },
    {
        name: "STYLING WITH EXTENSION",
        category: client_1.ServiceCategory.STYLING_SERVICE,
        description: "Hair styling incorporating extensions",
        singlePrice: 10000,
        combinedPrice: 15000,
        childPrice: null,
        childCombinedPrice: null,
    },
    {
        name: "BRAIDS & DREADLOCKS STYLING",
        category: client_1.ServiceCategory.STYLING_SERVICE,
        description: "Specialized styling for braids and dreadlocks",
        singlePrice: 9000,
        combinedPrice: 15000,
        childPrice: null,
        childCombinedPrice: null,
    },
    {
        name: "BRIDE STYLING",
        category: client_1.ServiceCategory.STYLING_SERVICE,
        description: "Special bridal hair styling service",
        singlePrice: 20000,
        combinedPrice: 25000,
        childPrice: null,
        childCombinedPrice: null,
    },
    {
        name: "SILKPRESS (FLAT, TRIM)",
        category: client_1.ServiceCategory.STYLING_SERVICE,
        description: "Professional silk press with flat iron and trim",
        singlePrice: 10000,
        combinedPrice: 15000,
        childPrice: null,
        childCombinedPrice: null,
    },
    {
        name: "BLOW DRYING",
        category: client_1.ServiceCategory.STYLING_SERVICE,
        description: "Professional blow dry service",
        singlePrice: 3000,
        combinedPrice: null,
        childPrice: null,
        childCombinedPrice: null,
    },
    // SPECIAL OFFERS
    {
        name: "DIY TREATMENT/KANTA SERVICE",
        category: client_1.ServiceCategory.SPECIAL_OFFERS,
        description: "Do-it-yourself treatment service with guidance",
        singlePrice: 10000,
        combinedPrice: null,
        childPrice: null,
        childCombinedPrice: null,
    }
];
exports.nappyhoodServices = nappyhoodServices;
async function seedServices() {
    try {
        console.log('🌱 Starting to seed Nappyhood services...');
        // Clear existing services (optional - remove this if you want to keep existing ones)
        await database_1.prisma.service.deleteMany({});
        console.log('🗑️ Cleared existing services');
        // Insert all services
        for (const service of nappyhoodServices) {
            try {
                const createdService = await database_1.prisma.service.create({
                    data: service
                });
                console.log(`✅ Created service: ${createdService.name}`);
            }
            catch (error) {
                console.error(`❌ Failed to create service ${service.name}:`, error);
            }
        }
        console.log('🎉 Successfully seeded all Nappyhood services!');
        // Display summary
        const totalServices = await database_1.prisma.service.count();
        console.log(`📊 Total services in database: ${totalServices}`);
        // Display services by category
        const servicesByCategory = await database_1.prisma.service.groupBy({
            by: ['category'],
            _count: {
                id: true
            }
        });
        console.log('\n📋 Services by category:');
        servicesByCategory.forEach(category => {
            console.log(`   ${category.category}: ${category._count.id} services`);
        });
    }
    catch (error) {
        console.error('💥 Error seeding services:', error);
    }
    finally {
        await database_1.prisma.$disconnect();
    }
}
// Run the seed function
if (require.main === module) {
    seedServices();
}
//# sourceMappingURL=seedServices.js.map