/**
 * Logger Middleware
 * 
 * Logs HTTP requests for debugging and monitoring.
 * Records request method, path, status code, and response time.
 * 
 * This helps with:
 * - Debugging issues
 * - Monitoring API usage
 * - Performance analysis
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Request logger middleware
 * 
 * Logs details about each HTTP request including:
 * - Timestamp
 * - HTTP method
 * - Request path
 * - Response status code
 * - Response time in milliseconds
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Record start time
  const startTime = Date.now();
  
  // Store original res.json function
  const originalJson = res.json.bind(res);
  
  // Override res.json to log when response is sent
  res.json = function(body: any) {
    // Calculate response time
    const duration = Date.now() - startTime;
    
    // Log request details
    console.log(
      `[${new Date().toISOString()}] ` +
      `${req.method} ${req.path} ` +
      `${res.statusCode} ` +
      `${duration}ms`
    );
    
    // Call original json function
    return originalJson(body);
  };
  
  next();
}

