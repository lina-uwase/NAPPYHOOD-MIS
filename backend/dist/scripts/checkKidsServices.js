"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../utils/database");
const client_1 = require("@prisma/client");
async function checkKidsServices() {
    try {
        const kidsServices = await database_1.prisma.service.findMany({
            where: { category: client_1.ServiceCategory.KIDS_SERVICES },
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
    }
    catch (error) {
        console.error('❌ Error:', error);
    }
    finally {
        await database_1.prisma.$disconnect();
    }
}
checkKidsServices();
//# sourceMappingURL=checkKidsServices.js.map