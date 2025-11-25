/**
 * Error Handling Middleware
 * 
 * Global error handler for the Express application.
 * Catches all errors that occur during request processing
 * and sends appropriate error responses.
 * 
 * This middleware should be registered last in the middleware chain
 * so it can catch errors from all other middleware and routes.
 */

import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.utils';

/**
 * Global error handler
 * 
 * Catches all errors thrown in the application and sends
 * standardized error responses to the client.
 * 
 * @param error - Error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error details for debugging
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query
  });
  
  // Send error response
  // In production, we might want to hide detailed error messages
  sendError(res, error.message || 'Internal server error', 500);
}

/**
 * 404 Not Found handler
 * 
 * Handles requests to undefined routes.
 * This should be registered before the error handler but after all valid routes.
 * 
 * @param req - Express request object
 * @param res - Express response object
 */
export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, `Route ${req.method} ${req.path} not found`, 404);
}

