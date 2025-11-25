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
  DEFAULT_VAT_RATE = 'default_vat_rate',
  DEFAULT_TAX_RATE = 'default_tax_rate',  // Deprecated, use default_vat_rate
  CURRENCY = 'currency',
  CURRENCY_SYMBOL = 'currency_symbol',
  TARGET_SALARY = 'target_salary',
  TAXABLE_PERCENTAGE = 'taxable_percentage',
  INCOME_TAX_RATE = 'income_tax_rate',
  HEALTH_INSURANCE_RATE = 'health_insurance_rate'
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
  default_vat_rate: number;           // Default VAT/IVA percentage for new invoices
  default_tax_rate?: number;          // Deprecated, for backward compatibility
  currency: string;                   // Currency code (EUR, USD, GBP, etc.)
  currency_symbol: string;            // Symbol for display (€, $, £, etc.)
  target_salary: number;              // Target monthly salary
  taxable_percentage: number;         // Percentage of income that is taxable (regime forfettario)
  income_tax_rate: number;            // Income tax rate (imposta sostitutiva)
  health_insurance_rate: number;      // Health insurance rate (INPS)
}

/**
 * Update Settings DTO
 * 
 * Used when updating application settings via API.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdateSettingsDTO {
  default_vat_rate?: number;
  default_tax_rate?: number;          // Deprecated, use default_vat_rate
  currency?: string;
  currency_symbol?: string;
  target_salary?: number;
  taxable_percentage?: number;
  income_tax_rate?: number;
  health_insurance_rate?: number;
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
    case SettingKey.DEFAULT_VAT_RATE:
    case SettingKey.DEFAULT_TAX_RATE:
    case SettingKey.TARGET_SALARY:
    case SettingKey.TAXABLE_PERCENTAGE:
    case SettingKey.INCOME_TAX_RATE:
    case SettingKey.HEALTH_INSURANCE_RATE:
      return parseFloat(value);
    case SettingKey.CURRENCY:
    case SettingKey.CURRENCY_SYMBOL:
      return value;
    default:
      // Try to parse as number, otherwise return as string
      const num = parseFloat(value);
      return isNaN(num) ? value : num;
  }
}

