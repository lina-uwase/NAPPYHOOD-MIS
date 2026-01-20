"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const initialProducts = [
    {
        name: 'Onion Oil',
        description: 'Hair growth oil',
        price: 6000,
        quantity: 0
    },
    {
        name: 'Growth Oil',
        description: 'Hair growth oil',
        price: 10000,
        quantity: 0
    },
    {
        name: 'Body & Hair Butter',
        description: 'Moisturizing butter for body and hair',
        price: 10000,
        quantity: 0
    },
    {
        name: 'Spray Bottle',
        description: 'Water spray bottle',
        price: 3000,
        quantity: 0
    },
    {
        name: 'Movit Spray',
        description: 'Hair spray',
        price: 4000,
        quantity: 0
    },
    {
        name: 'Black Soap',
        description: 'Natural black soap',
        price: 7000,
        quantity: 0
    }
];
async function seedProducts() {
    console.log('🌱 Seeding products...');
    for (const productData of initialProducts) {
        const existingProduct = await prisma.product.findUnique({
            where: { name: productData.name }
        });
        if (existingProduct) {
            console.log(`⏭️  Product "${productData.name}" already exists, skipping...`);
            continue;
        }
        const product = await prisma.product.create({
            data: productData
        });
        console.log(`✅ Created product: ${product.name} (${product.price} RWF)`);
    }
    console.log('✨ Product seeding completed!');
}
seedProducts()
    .catch((error) => {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seedProducts.js.map