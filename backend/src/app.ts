/**
 * Express Application Setup
 * 
 * This file configures the Express application with:
 * - Middleware (CORS, JSON parsing, logging)
 * - API routes
 * - Error handling
 * 
 * The app is exported and used by server.ts to start the HTTP server.
 */

import express, { Application } from 'express';
import cors from 'cors';
import { config } from './config/app.config';
import routes from './routes';
import { requestLogger } from './middleware/logger.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

/**
 * Create and configure Express application
 */
const app: Application = express();

/**
 * CORS Configuration
 * 
 * Enable Cross-Origin Resource Sharing to allow frontend
 * (running on different origin) to access this API.
 * This is essential for the frontend-backend communication.
 */
app.use(cors({
  origin: '*', // Allow all origins (since this is a local network app)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/**
 * Body Parser Middleware
 * 
 * Parse incoming request bodies in JSON format.
 * Makes req.body available in controllers.
 */
app.use(express.json());

/**
 * URL Encoded Parser
 * 
 * Parse URL-encoded request bodies (for form submissions).
 */
app.use(express.urlencoded({ extended: true }));

/**
 * Request Logger Middleware
 * 
 * Log all incoming requests for debugging and monitoring.
 */
app.use(requestLogger);

/**
 * Health Check Endpoint
 * 
 * Simple endpoint to verify that the API is running.
 * Useful for monitoring and Docker health checks.
 */
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.server.env
  });
});

/**
 * API Routes
 * 
 * Mount all API routes under /api prefix.
 * Routes are defined in the routes/ directory.
 */
app.use('/api', routes);

/**
 * 404 Handler
 * 
 * Handle requests to undefined routes.
 * This should come after all valid routes.
 */
app.use(notFoundHandler);

/**
 * Global Error Handler
 * 
 * Catch all errors from routes and middleware.
 * This should be the last middleware registered.
 */
app.use(errorHandler);

export default app;

