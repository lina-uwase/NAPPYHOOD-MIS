import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';

// Configure trace exporter
const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces',
  headers: {},
});

// Initialize SDK with comprehensive instrumentation
const sdk = new NodeSDK({
  serviceName: 'nappyhood-mis-api',
  traceExporter,
  instrumentations: [
    new HttpInstrumentation({
      // Capture request and response headers safely
      requestHook: (span, request) => {
        try {
          const req = request as any;
          if (req.headers) {
            span.setAttributes({
              'http.request.header.user-agent': req.headers['user-agent'] || '',
              'http.request.header.x-forwarded-for': req.headers['x-forwarded-for'] || '',
            });
          }
        } catch (error) {
          // Ignore errors in request hook
        }
      },
      responseHook: (span, response) => {
        try {
          const res = response as any;
          if (res.headers) {
            span.setAttributes({
              'http.response.header.content-type': res.headers['content-type'] || '',
            });
          }
        } catch (error) {
          // Ignore errors in response hook
        }
      },
    }),
    new ExpressInstrumentation({
      // Capture route information
      requestHook: (span, info) => {
        try {
          span.setAttributes({
            'express.route': info.route || '',
            'express.method': info.request?.method || '',
          });
        } catch (error) {
          // Ignore errors in request hook
        }
      },
    }),
  ],
});

// Start the SDK
sdk.start();

console.log('OpenTelemetry tracing initialized successfully');

export default sdk;
