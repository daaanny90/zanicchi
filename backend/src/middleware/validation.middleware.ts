/**
 * Validation Middleware
 * 
 * Provides request validation middleware functions.
 * These middleware validate request data before it reaches controllers.
 * 
 * Benefits:
 * - Centralizes validation logic
 * - Reduces code duplication
 * - Provides consistent error messages
 */

import { Request, Response, NextFunction } from 'express';
import { sendValidationError } from '../utils/response.utils';

/**
 * Validate request body exists
 * 
 * Ensures that POST/PUT requests have a body.
 * Should be used on routes that require request data.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function validateBody(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.body || Object.keys(req.body).length === 0) {
    sendValidationError(res, 'Request body is required');
    return;
  }
  
  next();
}

/**
 * Validate numeric ID parameter
 * 
 * Ensures that route parameters meant to be IDs are valid numbers.
 * Commonly used for /:id routes.
 * 
 * @param paramName - Name of the parameter to validate
 * @returns Middleware function
 */
export function validateNumericParam(paramName: string = 'id') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.params[paramName];
    const numValue = parseInt(value);
    
    if (isNaN(numValue) || numValue <= 0) {
      sendValidationError(res, `Invalid ${paramName}: must be a positive number`);
      return;
    }
    
    next();
  };
}

/**
 * Validate required fields in request body
 * 
 * Checks that specified fields are present in the request body.
 * 
 * @param fields - Array of required field names
 * @returns Middleware function
 */
export function validateRequiredFields(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields: string[] = [];
    
    for (const field of fields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      sendValidationError(
        res,
        `Missing required fields: ${missingFields.join(', ')}`
      );
      return;
    }
    
    next();
  };
}

