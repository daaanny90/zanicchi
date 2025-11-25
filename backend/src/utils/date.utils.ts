/**
 * Date Utilities
 * 
 * This module provides helper functions for date manipulation and formatting.
 * These utilities ensure consistent date handling throughout the application.
 * 
 * All dates are:
 * - Stored in YYYY-MM-DD format in the database
 * - Handled in UTC to avoid timezone issues
 * - Validated before use in queries
 */

/**
 * Format date to YYYY-MM-DD
 * 
 * Converts a Date object to MySQL-compatible date string.
 * This is the standard format used throughout the application.
 * 
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Get current date in YYYY-MM-DD format
 * 
 * @returns Today's date as string
 */
export function getCurrentDate(): string {
  return formatDate(new Date());
}

/**
 * Get first day of current month
 * 
 * Used for monthly calculations and reports.
 * 
 * @returns Date string for first day of current month
 */
export function getFirstDayOfMonth(): string {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  return formatDate(firstDay);
}

/**
 * Get last day of current month
 * 
 * Used for monthly calculations and reports.
 * 
 * @returns Date string for last day of current month
 */
export function getLastDayOfMonth(): string {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return formatDate(lastDay);
}

/**
 * Get first day of a specific month
 * 
 * @param year - Year number
 * @param month - Month number (1-12)
 * @returns Date string for first day of specified month
 */
export function getFirstDayOfSpecificMonth(year: number, month: number): string {
  const firstDay = new Date(year, month - 1, 1);
  return formatDate(firstDay);
}

/**
 * Get last day of a specific month
 * 
 * @param year - Year number
 * @param month - Month number (1-12)
 * @returns Date string for last day of specified month
 */
export function getLastDayOfSpecificMonth(year: number, month: number): string {
  const lastDay = new Date(year, month, 0);
  return formatDate(lastDay);
}

/**
 * Get date N months ago
 * 
 * Useful for getting data for charts (e.g., last 6 months).
 * 
 * @param monthsAgo - Number of months to go back
 * @returns Date string for N months ago
 */
export function getDateMonthsAgo(monthsAgo: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  return formatDate(date);
}

/**
 * Validate date string format
 * 
 * Checks if a string is in valid YYYY-MM-DD format.
 * 
 * @param dateString - String to validate
 * @returns true if valid, false otherwise
 */
export function isValidDateFormat(dateString: string): boolean {
  // Check format with regex: YYYY-MM-DD
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }
  
  // Check if it's a valid date
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Check if date1 is before date2
 * 
 * @param date1 - First date string (YYYY-MM-DD)
 * @param date2 - Second date string (YYYY-MM-DD)
 * @returns true if date1 is before date2
 */
export function isDateBefore(date1: string, date2: string): boolean {
  return new Date(date1) < new Date(date2);
}

/**
 * Check if date is in the past
 * 
 * @param dateString - Date string to check (YYYY-MM-DD)
 * @returns true if date is before today
 */
export function isDateInPast(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return date < today;
}

/**
 * Get month and year from date string
 * 
 * @param dateString - Date string (YYYY-MM-DD)
 * @returns Object with year and month
 */
export function getMonthYear(dateString: string): { year: number; month: number } {
  const date = new Date(dateString);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1
  };
}

