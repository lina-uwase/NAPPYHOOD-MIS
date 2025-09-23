"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const staffController_1 = require("../controllers/staffController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.get('/', auth_1.authenticateToken, staffController_1.getAllStaff);
router.get('/performance', auth_1.authenticateToken, (0, auth_1.requireRole)(['ADMIN', 'MANAGER']), staffController_1.getAllStaffPerformance);
router.get('/:id', auth_1.authenticateToken, staffController_1.getStaffById);
router.get('/:id/performance', auth_1.authenticateToken, (0, auth_1.requireRole)(['ADMIN', 'MANAGER']), staffController_1.getStaffPerformance);
router.put('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['ADMIN']), staffController_1.updateStaff);
exports.default = router;
//# sourceMappingURL=staff.js.map