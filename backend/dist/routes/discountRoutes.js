"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const discountController_1 = require("../controllers/discountController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
router.use((req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT') {
        const logPath = path_1.default.join(__dirname, '../../debug_discounts.log');
        const logEntry = `\n[${new Date().toISOString()}] ${req.method} ${req.url}\nBody: ${JSON.stringify(req.body, null, 2)}\n`;
        fs_1.default.appendFileSync(logPath, logEntry);
    }
    next();
});
router.use(auth_1.authenticateToken);
router.get('/', discountController_1.getAllDiscountRules);
router.post('/', discountController_1.createDiscountRule);
router.put('/:id', discountController_1.updateDiscountRule);
router.delete('/:id', discountController_1.deleteDiscountRule);
router.post('/:id/notify', discountController_1.notifyCustomers);
exports.default = router;
//# sourceMappingURL=discountRoutes.js.map