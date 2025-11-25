/**
 * Settings Model
 * 
 * This file defines the TypeScript interfaces and types for application settings.
 * Settings are stored as key-value pairs in the database and control
 * various aspects of the application behavior.
 * 
 * The model includes:
 * - SettingKey: Enum for valid setting keys
 * - Setting interface: Complete setting data structure
 * - UpdateSettingsDTO: Data Transfer Object for updating multiple settings
 */

/**
 * Setting Key Enum
 * 
 * Defines all valid setting keys that can be stored in the database.
 * This ensures type safety when accessing settings.
 */
export enum SettingKey {
  DEFAULT_TAX_RATE = 'default_tax_rate',
  CURRENCY = 'currency',
  CURRENCY_SYMBOL = 'currency_symbol'
}

/**
 * Setting Interface
 * 
 * Represents a single setting record as stored in the database.
 * Settings use a simple key-value structure with optional description.
 */
export interface Setting {
  setting_key: string;          // Unique key identifying the setting
  setting_value: string;        // Value stored as text (parse as needed)
  description: string | null;   // Human-readable description
  updated_at: string;           // Last update timestamp
}

/**
 * Settings Object
 * 
 * Typed object containing all application settings.
 * Used for type-safe access to settings in the application.
 */
export interface Settings {
  default_tax_rate: number;     // Default tax percentage for new invoices
  currency: string;             // Currency code (EUR, USD, GBP, etc.)
  currency_symbol: string;      // Symbol for display (€, $, £, etc.)
}

/**
 * Update Settings DTO
 * 
 * Used when updating application settings via API.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdateSettingsDTO {
  default_tax_rate?: number;
  currency?: string;
  currency_symbol?: string;
}

/**
 * Parse a setting value based on its key
 * 
 * Settings are stored as strings in the database but need to be
 * parsed to their appropriate types in the application.
 * 
 * @param key - The setting key
 * @param value - The string value from database
 * @returns Parsed value with correct type
 */
export function parseSettingValue(key: string, value: string): string | number {
  switch (key) {
    case SettingKey.DEFAULT_TAX_RATE:
      return parseFloat(value);
    case SettingKey.CURRENCY:
    case SettingKey.CURRENCY_SYMBOL:
      return value;
    default:
      return value;
  }
}

