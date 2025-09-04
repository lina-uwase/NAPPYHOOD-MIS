import * as client from 'prom-client';

// Collect default metrics (CPU, memory, event loop lag, etc.)
client.collectDefaultMetrics({
  prefix: 'nappyhood_mis_',
  labels: { service: 'nappyhood-mis-api' }
});

// HTTP Request Duration Histogram
export const httpRequestDuration = new client.Histogram({
  name: 'nappyhood_mis_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'endpoint'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

// HTTP Request Counter
export const httpRequestTotal = new client.Counter({
  name: 'nappyhood_mis_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'endpoint'],
});

// Active HTTP Connections
export const httpActiveConnections = new client.Gauge({
  name: 'nappyhood_mis_http_active_connections',
  help: 'Number of active HTTP connections',
});

// Authentication Metrics
export const authenticationAttempts = new client.Counter({
  name: 'nappyhood_mis_auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['type', 'status', 'method'], // type: login|2fa|refresh, status: success|failure, method: local|google
});

export const activeUserSessions = new client.Gauge({
  name: 'nappyhood_mis_active_user_sessions',
  help: 'Number of active user sessions',
  labelNames: ['role'],
});

// Database Metrics
export const databaseQueryDuration = new client.Histogram({
  name: 'nappyhood_mis_database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

export const databaseConnections = new client.Gauge({
  name: 'nappyhood_mis_database_connections',
  help: 'Number of database connections',
  labelNames: ['state'], // active, idle, waiting
});

// Business Metrics for NAPPYHOOD MIS
export const dataSubmissions = new client.Counter({
  name: 'nappyhood_mis_data_submissions_total',
  help: 'Total number of data submissions',
  labelNames: ['facility_type', 'location_type', 'status'], // facility_type: household|school|health|market, status: success|failure
});

export const userRegistrations = new client.Counter({
  name: 'nappyhood_mis_user_registrations_total',
  help: 'Total number of user registrations',
  labelNames: ['role', 'status'], // status: success|failure
});

export const facilityCount = new client.Gauge({
  name: 'nappyhood_mis_facilities_total',
  help: 'Total number of facilities by type',
  labelNames: ['type', 'province', 'district'],
});

export const locationCoverage = new client.Gauge({
  name: 'nappyhood_mis_location_coverage',
  help: 'Coverage metrics by location',
  labelNames: ['province', 'district', 'sector', 'metric_type'], // metric_type: households|schools|health_facilities|markets
});

// Email Metrics
export const emailsSent = new client.Counter({
  name: 'nappyhood_mis_emails_sent_total',
  help: 'Total number of emails sent',
  labelNames: ['type', 'status'], // type: verification|password_reset|2fa_setup|notification, status: success|failure
});

// Error Metrics
export const applicationErrors = new client.Counter({
  name: 'nappyhood_mis_errors_total',
  help: 'Total number of application errors',
  labelNames: ['type', 'severity', 'module'], // type: validation|database|auth|business, severity: low|medium|high|critical
});

// Performance Metrics
export const memoryUsage = new client.Gauge({
  name: 'nappyhood_mis_memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['type'], // heap_used, heap_total, external, rss
});

export const eventLoopLag = new client.Histogram({
  name: 'nappyhood_mis_event_loop_lag_seconds',
  help: 'Event loop lag in seconds',
  buckets: [0.001, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1],
});

// Cache Metrics (if using Redis or in-memory cache)
export const cacheOperations = new client.Counter({
  name: 'nappyhood_mis_cache_operations_total',
  help: 'Total number of cache operations',
  labelNames: ['operation', 'status'], // operation: get|set|delete, status: hit|miss|success|failure
});

export default client;
