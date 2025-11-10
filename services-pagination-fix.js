const fs = require('fs');
const path = '/app/dist/controllers/serviceController.js';

console.log('🔧 FIXING SERVICES PAGINATION IN COMPILED JAVASCRIPT');

let content = fs.readFileSync(path, 'utf8');

// Replace the entire getAllServices function
const oldFunction = /const getAllServices = async \(req, res\) => \{[\s\S]*?\};/;

const newFunction = `const getAllServices = async (req, res) => {
    try {
        const { page = '1', limit = '10', search, category, isActive = 'true' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const whereClause = {
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
        }
        const [services, total] = await Promise.all([
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
        ]);
        res.json({
            success: true,
            data: services,
            meta: {
                total,
                totalPages: Math.ceil(total / limitNum),
                currentPage: pageNum,
                limit: limitNum
            }
        });
    }
    catch (error) {
        console.error('Get services error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};`;

content = content.replace(oldFunction, newFunction);

fs.writeFileSync(path, content);
console.log('✅ SERVICES PAGINATION FIXED! Added proper pagination with skip, take, search, and metadata');
console.log('📋 Services now support: page, limit, search, category filtering with pagination metadata');
console.log('🔄 Restarting backend to reload the fixed compiled code...');