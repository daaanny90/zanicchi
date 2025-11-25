/**
 * Application Configuration
 * 
 * Central configuration file that exports all application settings.
 * Configuration values are loaded from environment variables with
 * sensible defaults for development.
 * 
 * This approach:
 * - Keeps all config in one place
 * - Provides type safety for config values
 * - Makes it easy to add new configuration options
 * - Supports different environments (dev, production)
 */

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Application Configuration Object
 * 
 * Contains all configuration settings organized by category.
 */
export const config = {
  /**
   * Server Configuration
   */
  server: {
    // Port number for the HTTP server
    port: parseInt(process.env.PORT || '3000'),
    // Environment: 'development' or 'production'
    env: process.env.NODE_ENV || 'development',
    // Enable CORS for frontend access
    corsEnabled: true
  },

  /**
   * Database Configuration
   */
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    name: process.env.DB_NAME || 'freelancer_finance',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  },

  /**
   * Application Defaults
   */
  defaults: {
    // Default tax rate percentage for new invoices
    taxRate: parseFloat(process.env.DEFAULT_TAX_RATE || '22'),
    // Currency code (EUR, USD, GBP, etc.)
    currency: process.env.CURRENCY || 'EUR',
    // Currency symbol for display
    currencySymbol: getCurrencySymbol(process.env.CURRENCY || 'EUR')
  }
};

/**
 * Get currency symbol from currency code
 * 
 * Maps common currency codes to their symbols.
 * Returns the code itself if symbol is unknown.
 * 
 * @param currency - Currency code (e.g., 'EUR', 'USD')
 * @returns Currency symbol (e.g., '€', '$')
 */
function getCurrencySymbol(currency: string): string {
  const symbolMap: Record<string, string> = {
    'EUR': '€',
    'USD': '$',
    'GBP': '£',
    'JPY': '¥',
    'CHF': 'Fr',
    'CAD': 'C$',
    'AUD': 'A$'
  };
  
  return symbolMap[currency.toUpperCase()] || currency;
}

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => {
  return config.server.env === 'development';
};

/**
 * Check if running in production mode
 */
export const isProduction = (): boolean => {
  return config.server.env === 'production';
};

