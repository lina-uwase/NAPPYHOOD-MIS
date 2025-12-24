import { Router } from 'express';
import {
    getAllDiscountRules,
    createDiscountRule,
    updateDiscountRule,
    deleteDiscountRule,
    notifyCustomers
} from '../controllers/discountController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

import fs from 'fs';
import path from 'path';

router.use((req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT') {
        const logPath = path.join(__dirname, '../../debug_discounts.log');
        const logEntry = `\n[${new Date().toISOString()}] ${req.method} ${req.url}\nBody: ${JSON.stringify(req.body, null, 2)}\n`;
        fs.appendFileSync(logPath, logEntry);
    }
    next();
});

router.use(authenticateToken);

router.get('/', getAllDiscountRules);
router.post('/', createDiscountRule);
router.put('/:id', updateDiscountRule);
router.delete('/:id', deleteDiscountRule);
router.post('/:id/notify', notifyCustomers);

export default router;
