/**
 * Settings Controller
 * 
 * HTTP request handlers for application settings endpoints.
 * Manages global application configuration like tax rates and currency.
 */

import { Request, Response } from 'express';
import * as settingsService from '../services/settings.service';
import { sendSuccess, sendError } from '../utils/response.utils';

/**
 * Get all settings
 * 
 * GET /api/settings
 * Returns all application settings as a typed object
 */
export async function getAllSettings(_req: Request, res: Response): Promise<void> {
  try {
    const settings = await settingsService.getAllSettings();
    sendSuccess(res, settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    sendError(res, 'Failed to fetch settings');
  }
}

/**
 * Update settings
 * 
 * PUT /api/settings
 * Body: UpdateSettingsDTO
 * Updates one or more application settings
 */
export async function updateSettings(req: Request, res: Response): Promise<void> {
  try {
    const settings = await settingsService.updateSettings(req.body);
    sendSuccess(res, settings, 'Settings updated successfully');
  } catch (error) {
    console.error('Error updating settings:', error);
    sendError(res, 'Failed to update settings');
  }
}

