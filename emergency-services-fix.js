// Emergency fix for broken services pagination
const fs = require('fs');
const path = '/app/dist/controllers/serviceController.js';

console.log('🚨 EMERGENCY: Restoring working services API');

// First restore from backup
try {
    const backup = fs.readFileSync('/app/dist/controllers/serviceController.js.backup', 'utf8');
    fs.writeFileSync(path, backup);
    console.log('✅ Restored working services controller from backup');
} catch (error) {
    console.log('⚠️ Backup not found, applying manual fix...');

    // Manual fix if backup doesn't exist
    const workingCode = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteService = exports.updateService = exports.createService = exports.getServiceById = exports.getAllServices = void 0;
const database_1 = require("../utils/database");
const getAllServices = async (req, res) => {
    try {
        const { category, isActive = 'true' } = req.query;
        const whereClause = {
            isActive: isActive === 'true'
        };
        if (category) {
            whereClause.category = category;
        }
        const services = await database_1.prisma.service.findMany({
            where: whereClause,
            orderBy: [
                { category: 'asc' },
                { name: 'asc' }
            ]
        });
        res.json({
            success: true,
            data: services
        });
    }
    catch (error) {
        console.error('Get services error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAllServices = getAllServices;`;

    fs.writeFileSync(path, workingCode);
    console.log('✅ Applied manual working code');
}

console.log('🔄 Services API should be working now - restart backend container');