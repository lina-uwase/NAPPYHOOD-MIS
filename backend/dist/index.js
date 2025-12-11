"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const userProfile_1 = __importDefault(require("./routes/userProfile"));
const services_1 = __importDefault(require("./routes/services"));
const customers_1 = __importDefault(require("./routes/customers"));
const sales_1 = __importDefault(require("./routes/sales"));
const staff_1 = __importDefault(require("./routes/staff"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const products_1 = __importDefault(require("./routes/products"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '5000', 10);
// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Nappyhood Salon Management System API',
            version: '1.0.0',
            description: 'API documentation for Nappyhood Salon Management System',
            contact: {
                name: 'Nappyhood Salon',
                email: 'nappyhood.boutique@gmail.com'
            }
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./dist/routes/*.js', './src/routes/*.ts']
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(swaggerOptions);
// Security middleware
app.use((0, helmet_1.default)());
// CORS configuration
const corsOrigins = process.env.NODE_ENV === 'production'
    ? ['https://nappyhood.com', 'https://www.nappyhood.com', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003']
    : ['https://nappyhood.com', 'https://www.nappyhood.com', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'];
console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
console.log('🔄 CORS Origins:', corsOrigins);
console.log('🗄️ DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('🔑 JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
app.use((0, cors_1.default)({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
    preflightContinue: false,
    optionsSuccessStatus: 200
}));
// Request logging
app.use((0, morgan_1.default)('combined'));
// Custom request logging
app.use((req, res, next) => {
    console.log(`📡 INCOMING REQUEST: ${req.method} ${req.path} - ${new Date().toISOString()}`);
    // Extra logging for DELETE requests
    if (req.method === 'DELETE') {
        console.log('🔍 DELETE REQUEST DETAILS:', {
            url: req.url,
            originalUrl: req.originalUrl,
            baseUrl: req.baseUrl,
            path: req.path,
            params: req.params,
            headers: {
                authorization: req.headers.authorization ? 'Bearer [PRESENT]' : 'MISSING',
                'content-type': req.headers['content-type'],
                'user-agent': req.headers['user-agent']
            }
        });
    }
    next();
});
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Static files serving (for profile pictures)
app.use('/uploads', express_1.default.static('uploads'));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Nappyhood Salon API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});
// Swagger documentation
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
// API routes
app.use('/api/auth', auth_1.default);
app.use('/api/profile', userProfile_1.default);
app.use('/api/services', services_1.default);
app.use('/api/customers', customers_1.default);
app.use('/api/sales', sales_1.default);
app.use('/api/staff', staff_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.use('/api/products', products_1.default);
// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Nappyhood Salon Management System API',
        version: '1.0.0',
        documentation: '/api-docs'
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
    });
});
// Global error handler
app.use((err, req, res, next) => {
    console.error('🚨 GLOBAL ERROR HANDLER TRIGGERED:', err);
    console.error('🔍 Error details:', {
        message: err.message,
        stack: err.stack,
        code: err.code,
        meta: err.meta,
        method: req.method,
        url: req.url,
        params: req.params
    });
    if (err.code === 'P2002') {
        console.error('❌ Prisma duplicate entry error');
        return res.status(400).json({
            error: 'Duplicate entry',
            field: err.meta?.target?.[0] || 'unknown'
        });
    }
    if (err.code === 'P2025') {
        console.error('❌ Prisma record not found error');
        return res.status(404).json({
            error: 'Record not found'
        });
    }
    console.error('❌ Generic error, returning 500');
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});
// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Nappyhood Salon API server running on port ${PORT}`);
    console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
exports.default = app;
//# sourceMappingURL=index.js.map