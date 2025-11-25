/**
 * Response Utilities
 * 
 * This module provides standardized response formats for API endpoints.
 * Using consistent response structures makes the API easier to consume
 * and allows the frontend to handle responses uniformly.
 * 
 * All responses follow a standard format:
 * - success: boolean indicating if request succeeded
 * - data: the actual response data (for successful requests)
 * - error: error message (for failed requests)
 * - message: optional human-readable message
 */

import { Response } from 'express';

/**
 * Standard API Response Interface
 * 
 * All API responses conform to this structure.
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Send success response
 * 
 * Sends a standardized success response with optional data and message.
 * 
 * @param res - Express response object
 * @param data - Data to include in response
 * @param message - Optional success message
 * @param statusCode - HTTP status code (default: 200)
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message })
  };
  
  res.status(statusCode).json(response);
}

/**
 * Send error response
 * 
 * Sends a standardized error response with error message.
 * 
 * @param res - Express response object
 * @param error - Error message or Error object
 * @param statusCode - HTTP status code (default: 500)
 */
export function sendError(
  res: Response,
  error: string | Error,
  statusCode: number = 500
): void {
  const errorMessage = error instanceof Error ? error.message : error;
  
  const response: ApiResponse = {
    success: false,
    error: errorMessage
  };
  
  res.status(statusCode).json(response);
}

/**
 * Send not found response
 * 
 * Convenience method for 404 responses.
 * 
 * @param res - Express response object
 * @param resource - Name of the resource that wasn't found
 */
export function sendNotFound(
  res: Response,
  resource: string = 'Resource'
): void {
  sendError(res, `${resource} not found`, 404);
}

/**
 * Send validation error response
 * 
 * Convenience method for 400 validation errors.
 * 
 * @param res - Express response object
 * @param message - Validation error message
 */
export function sendValidationError(
  res: Response,
  message: string
): void {
  sendError(res, message, 400);
}

/**
 * Send created response
 * 
 * Convenience method for 201 created responses.
 * Used when a new resource is successfully created.
 * 
 * @param res - Express response object
 * @param data - The created resource
 * @param message - Optional success message
 */
export function sendCreated<T>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully'
): void {
  sendSuccess(res, data, message, 201);
}

