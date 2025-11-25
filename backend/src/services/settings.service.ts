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
    if (key === 'default_tax_rate') {
      settings.default_tax_rate = value as number;
    } else if (key === 'currency') {
      settings.currency = value as string;
    } else if (key === 'currency_symbol') {
      settings.currency_symbol = value as string;
    }
  });
  
  // Return with defaults if any setting is missing
  return {
    default_tax_rate: settings.default_tax_rate || 22,
    currency: settings.currency || 'EUR',
    currency_symbol: settings.currency_symbol || '€'
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
  
  if (updates.default_tax_rate !== undefined) {
    updatePromises.push(
      db.query(
        'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
        [updates.default_tax_rate.toString(), 'default_tax_rate']
      )
    );
  }
  
  if (updates.currency !== undefined) {
    updatePromises.push(
      db.query(
        'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
        [updates.currency, 'currency']
      )
    );
  }
  
  if (updates.currency_symbol !== undefined) {
    updatePromises.push(
      db.query(
        'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
        [updates.currency_symbol, 'currency_symbol']
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

