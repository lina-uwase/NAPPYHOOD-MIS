"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProfilePicture = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure uploads directory exists
const uploadsDir = path_1.default.join(process.cwd(), 'uploads', 'profile-pictures');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Get user ID from request (assumes auth middleware has run)
        const userId = req.user?.id || 'unknown';
        const timestamp = Date.now();
        const ext = path_1.default.extname(file.originalname);
        cb(null, `user-${userId}-${timestamp}${ext}`);
    }
});
const fileFilter = (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        const error = new Error('Only image files are allowed');
        cb(error);
    }
};
exports.uploadProfilePicture = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});
//# sourceMappingURL=upload.js.map