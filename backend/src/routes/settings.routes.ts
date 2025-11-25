/**
 * Settings Routes
 * 
 * Defines all HTTP routes for application settings.
 * Manages global configuration like tax rates and currency.
 */

import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller';

const router = Router();

/**
 * GET /api/settings
 * Get all application settings
 */
router.get('/', settingsController.getAllSettings);

/**
 * PUT /api/settings
 * Update application settings
 */
router.put('/', settingsController.updateSettings);

export default router;

