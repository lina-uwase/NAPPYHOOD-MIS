import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUI from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

// Import routes
import authRoutes from './routes/auth';
import userProfileRoutes from './routes/userProfile';
import serviceRoutes from './routes/services';
import customerRoutes from './routes/customers';
import salesRoutes from './routes/sales';
import staffRoutes from './routes/staff';
import dashboardRoutes from './routes/dashboard';
import productRoutes from './routes/products';

// Load environment variables
dotenv.config();

const app = express();
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

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Security middleware
app.use(helmet());

// CORS configuration
const corsOrigins = process.env.NODE_ENV === 'production'
  ? ['https://nappyhood.com', 'https://www.nappyhood.com', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003']
  : ['https://nappyhood.com', 'https://www.nappyhood.com', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'];

console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
console.log('🔄 CORS Origins:', corsOrigins);
console.log('🗄️ DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('🔑 JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Request logging
app.use(morgan('combined'));

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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files serving (for profile pictures)
app.use('/uploads', express.static('uploads'));

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
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', userProfileRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);

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
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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

export default app;