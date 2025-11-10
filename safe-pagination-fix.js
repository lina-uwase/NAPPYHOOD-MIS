const fs = require('fs');
const path = '/app/dist/controllers/serviceController.js';

console.log('🔧 SAFE SERVICES PAGINATION FIX');

let content = fs.readFileSync(path, 'utf8');

// Show current code first
console.log('📋 Current getAllServices function:');
const lines = content.split('\n');
for (let i = 4; i < 25; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

// Replace only the query parameters extraction
const oldParams = `const { category, isActive = 'true' } = req.query;`;
const newParams = `const { page = '1', limit = '10', search, category, isActive = 'true' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;`;

content = content.replace(oldParams, newParams);

// Add search to whereClause
const oldWhereClause = `const whereClause = {
            isActive: isActive === 'true'
        };
        if (category) {
            whereClause.category = category;
        }`;

const newWhereClause = `const whereClause = {
            isActive: isActive === 'true'
        };
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (category) {
            whereClause.category = category;
        }`;

content = content.replace(oldWhereClause, newWhereClause);

// Replace the prisma query to add pagination and get count
const oldQuery = `const services = await database_1.prisma.service.findMany({
            where: whereClause,
            orderBy: [
                { category: 'asc' },
                { name: 'asc' }
            ]
        });`;

const newQuery = `const [services, total] = await Promise.all([
            database_1.prisma.service.findMany({
                where: whereClause,
                skip,
                take: limitNum,
                orderBy: [
                    { category: 'asc' },
                    { name: 'asc' }
                ]
            }),
            database_1.prisma.service.count({ where: whereClause })
        ]);`;

content = content.replace(oldQuery, newQuery);

// Replace the response to include meta
const oldResponse = `res.json({
            success: true,
            data: services
        });`;

const newResponse = `res.json({
            success: true,
            data: services,
            meta: {
                total,
                totalPages: Math.ceil(total / limitNum),
                currentPage: pageNum,
                limit: limitNum
            }
        });`;

content = content.replace(oldResponse, newResponse);

// Write the file
fs.writeFileSync(path, content);

console.log('✅ SAFE PAGINATION FIX APPLIED!');
console.log('📊 Added: page, limit, search parameters');
console.log('📊 Added: pagination metadata (total, totalPages, currentPage, limit)');
console.log('📊 Added: search functionality across name and description');
console.log('🔄 Backend needs restart to load the changes...');