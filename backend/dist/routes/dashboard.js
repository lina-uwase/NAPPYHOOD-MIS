"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_1 = require("../controllers/dashboardController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Dashboard routes (admin and manager access)
router.get('/stats', auth_1.authenticateToken, (0, auth_1.requireRole)(['ADMIN', 'MANAGER']), dashboardController_1.getDashboardStats);
router.get('/analytics', auth_1.authenticateToken, (0, auth_1.requireRole)(['ADMIN', 'MANAGER']), dashboardController_1.getRevenueAnalytics);
exports.default = router;
//# sourceMappingURL=dashboard.js.map