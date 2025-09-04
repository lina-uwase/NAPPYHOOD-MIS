import * as winston from 'winston';
import LokiTransport from 'winston-loki';
import { trace } from '@opentelemetry/api';

// Custom format to include trace information
const traceFormat = winston.format((info) => {
  const span = trace.getActiveSpan();
  if (span) {
    const spanContext = span.spanContext();
    info.trace_id = spanContext.traceId;
    info.span_id = spanContext.spanId;
  }
  return info;
});

// Custom format for structured logging
const structuredFormat = winston.format.combine(
  winston.format.timestamp(),
  traceFormat(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, trace_id, span_id, service, module, ...meta }) => {
    const logEntry: Record<string, unknown> = {
      timestamp,
      level,
      message,
      service: service || 'nappyhood-mis-api',
      module: module || 'unknown',
      ...meta,
    };
    if (trace_id) {
      (logEntry as any).trace_id = trace_id;
    }
    if (span_id) {
      (logEntry as any).span_id = span_id;
    }
    return JSON.stringify(logEntry);
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  traceFormat(),
  winston.format.printf(({ timestamp, level, message, trace_id, service, module, ...meta }) => {
    const traceInfo = trace_id ? ` [trace:${String(trace_id).substring(0, 8)}]` : '';
    const serviceInfo = service ? ` [${service}]` : '';
    const moduleInfo = module ? ` [${module}]` : '';
    const metaInfo = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}${serviceInfo}${moduleInfo}${traceInfo}: ${message}${metaInfo}`;
  })
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug',
    })
  );
}

// Loki transport for log aggregation
if (process.env.LOKI_URL || process.env.NODE_ENV === 'production') {
  transports.push(
    new LokiTransport({
      host: process.env.LOKI_URL || 'http://localhost:3100',
      labels: {
        job: 'nappyhood-mis-api',
        service: 'nappyhood-mis-api',
        environment: process.env.NODE_ENV || 'development',
      },
      format: structuredFormat,
      level: 'info',
      onConnectionError: (err) => {
        console.error('Loki connection error:', err);
      },
    })
  );
}

// File transport for local development and backup
transports.push(
  new winston.transports.File({
    filename: 'logs/nappyhood-mis-error.log',
    level: 'error',
    format: structuredFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  new winston.transports.File({
    filename: 'logs/nappyhood-mis-combined.log',
    format: structuredFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  })
);

// Create the logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: structuredFormat,
  defaultMeta: {
    service: 'nappyhood-mis-api',
    environment: process.env.NODE_ENV || 'development',
  },
  transports,
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ],
});

// Helper functions for structured logging
export const createModuleLogger = (module: string) => {
  return {
    debug: (message: string, meta?: any) => logger.debug(message, { module, ...meta }),
    info: (message: string, meta?: any) => logger.info(message, { module, ...meta }),
    warn: (message: string, meta?: any) => logger.warn(message, { module, ...meta }),
    error: (message: string, meta?: any) => logger.error(message, { module, ...meta }),
  };
};

export default logger;
