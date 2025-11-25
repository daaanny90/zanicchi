/**
 * Settings Service
 * 
 * Business logic for managing application settings.
 * Settings are stored in the database as key-value pairs and cached
 * for performance.
 * 
 * This service handles:
 * - Retrieving all settings
 * - Updating individual settings
 * - Providing type-safe access to settings
 */

import { RowDataPacket } from 'mysql2';
import db from '../config/database';
import { Settings, parseSettingValue, UpdateSettingsDTO } from '../models/Settings.model';

/**
 * Get all application settings
 * 
 * Retrieves all settings from the database and returns them
 * as a typed Settings object for easy access.
 * 
 * @returns Promise resolving to Settings object
 */
export async function getAllSettings(): Promise<Settings> {
  // Query all settings from database
  const [rows] = await db.query<RowDataPacket[]>(
    'SELECT setting_key, setting_value FROM settings'
  );
  
  // Convert rows to Settings object with proper types
  const settings: Partial<Settings> = {};
  
  rows.forEach((row) => {
    const key = row.setting_key;
    const value = parseSettingValue(key, row.setting_value);
    
    // Map database keys to Settings object properties
    if (key === 'default_vat_rate') {
      settings.default_vat_rate = value as number;
    } else if (key === 'default_tax_rate') {
      settings.default_tax_rate = value as number;
    } else if (key === 'currency') {
      settings.currency = value as string;
    } else if (key === 'currency_symbol') {
      settings.currency_symbol = value as string;
    } else if (key === 'target_salary') {
      settings.target_salary = value as number;
    } else if (key === 'taxable_percentage') {
      settings.taxable_percentage = value as number;
    } else if (key === 'income_tax_rate') {
      settings.income_tax_rate = value as number;
    } else if (key === 'health_insurance_rate') {
      settings.health_insurance_rate = value as number;
    }
  });
  
  // Return with defaults if any setting is missing
  // Support backward compatibility with default_tax_rate
  return {
    default_vat_rate: settings.default_vat_rate || settings.default_tax_rate || 22,
    default_tax_rate: settings.default_tax_rate || settings.default_vat_rate || 22,
    currency: settings.currency || 'EUR',
    currency_symbol: settings.currency_symbol || '€',
    target_salary: settings.target_salary || 3000,
    taxable_percentage: settings.taxable_percentage || 67,
    income_tax_rate: settings.income_tax_rate || 15,
    health_insurance_rate: settings.health_insurance_rate || 27
  };
}

/**
 * Update application settings
 * 
 * Updates one or more settings in the database.
 * Only provided fields will be updated.
 * 
 * @param updates - Object containing settings to update
 * @returns Promise resolving to updated Settings object
 */
export async function updateSettings(updates: UpdateSettingsDTO): Promise<Settings> {
  // Update each provided setting
  const updatePromises: Promise<any>[] = [];
  
  if (updates.default_vat_rate !== undefined) {
    updatePromises.push(
      db.query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        ['default_vat_rate', updates.default_vat_rate.toString(), updates.default_vat_rate.toString()]
      )
    );
  }
  
  if (updates.default_tax_rate !== undefined) {
    updatePromises.push(
      db.query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        ['default_tax_rate', updates.default_tax_rate.toString(), updates.default_tax_rate.toString()]
      )
    );
  }
  
  if (updates.currency !== undefined) {
    updatePromises.push(
      db.query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        ['currency', updates.currency, updates.currency]
      )
    );
  }
  
  if (updates.currency_symbol !== undefined) {
    updatePromises.push(
      db.query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        ['currency_symbol', updates.currency_symbol, updates.currency_symbol]
      )
    );
  }
  
  if (updates.target_salary !== undefined) {
    updatePromises.push(
      db.query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        ['target_salary', updates.target_salary.toString(), updates.target_salary.toString()]
      )
    );
  }
  
  if (updates.taxable_percentage !== undefined) {
    updatePromises.push(
      db.query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        ['taxable_percentage', updates.taxable_percentage.toString(), updates.taxable_percentage.toString()]
      )
    );
  }
  
  if (updates.income_tax_rate !== undefined) {
    updatePromises.push(
      db.query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        ['income_tax_rate', updates.income_tax_rate.toString(), updates.income_tax_rate.toString()]
      )
    );
  }
  
  if (updates.health_insurance_rate !== undefined) {
    updatePromises.push(
      db.query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        ['health_insurance_rate', updates.health_insurance_rate.toString(), updates.health_insurance_rate.toString()]
      )
    );
  }
  
  // Execute all updates
  await Promise.all(updatePromises);
  
  // Return updated settings
  return getAllSettings();
}

/**
 * Get a single setting value
 * 
 * Retrieves a specific setting by key.
 * 
 * @param key - Setting key to retrieve
 * @returns Promise resolving to setting value
 */
export async function getSetting(key: string): Promise<string | null> {
  const [rows] = await db.query<RowDataPacket[]>(
    'SELECT setting_value FROM settings WHERE setting_key = ?',
    [key]
  );
  
  if (rows.length === 0) {
    return null;
  }
  
  return rows[0].setting_value;
}

