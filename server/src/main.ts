import './tracing';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { logger, createModuleLogger } from './logger';
import {
  httpRequestDuration,
  httpRequestTotal,
  httpActiveConnections,
} from './metrics';
import { trace } from '@opentelemetry/api';

const appLogger = createModuleLogger('main');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  app.useLogger(logger);

  // Enhanced metrics middleware
  app.use((req: any, res: any, next: any) => {
    const startTime = Date.now();
    const end = httpRequestDuration.startTimer();

    // Track active connections
    httpActiveConnections.inc();

    // Get current span for tracing
    const span = trace.getActiveSpan();
    if (span) {
      span.setAttributes({
        'http.method': req.method,
        'http.url': req.url,
        'http.user_agent': req.headers['user-agent'] || '',
      });
    }

    res.on('finish', () => {
      const duration = (Date.now() - startTime) / 1000;
      const route = req.route?.path || req.url;
      const endpoint = req.url.split('?')[0]; // Remove query parameters

      // Record metrics
      end({
        method: req.method,
        route: route,
        status_code: res.statusCode.toString(),
        endpoint: endpoint,
      });

      httpRequestTotal.inc({
        method: req.method,
        route: route,
        status_code: res.statusCode.toString(),
        endpoint: endpoint,
      });

      // Decrease active connections
      httpActiveConnections.dec();

      // Log request
      appLogger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        status_code: res.statusCode,
        duration_ms: duration * 1000,
        user_agent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress,
      });

      // Add span attributes
      if (span) {
        span.setAttributes({
          'http.status_code': res.statusCode,
          'http.response_size': res.get('content-length') || 0,
        });
      }
    });

    next();
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  app.enableCors({
    origin: '*',
    // origin: process.env.FE_URL || "http://localhost:3000",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    credentials: true,
    optionsSuccessStatus: 204
  })

  const config = new DocumentBuilder()
    .setTitle('NAPPYHOOD MIS API')
    .setDescription('API for the NAPPYHOOD Management Information System')
    .setVersion('1.0')
    .addServer('/api/v1')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  app.setGlobalPrefix('api/v1');

  // Start memory monitoring
  setInterval(() => {
    const memUsage = process.memoryUsage();
    // Memory metrics are automatically collected by prom-client default metrics
    appLogger.debug('Memory usage', {
      heap_used: memUsage.heapUsed,
      heap_total: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
    });
  }, 30000); // Every 30 seconds

  const port = process.env.PORT || 8080;
  await app.listen(port);

  appLogger.info('NAPPYHOOD MIS API started successfully', {
    port: port,
    environment: process.env.NODE_ENV || 'development',
    url: await app.getUrl(),
  });

  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap().catch((error) => {
  appLogger.error('Failed to start application', { error: error.message, stack: error.stack });
  process.exit(1);
});
