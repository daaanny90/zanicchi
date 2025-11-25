/**
 * Route Index
 * 
 * Aggregates all route modules and exports them for use in the main app.
 * This provides a central place to manage all API routes.
 */

import { Router } from 'express';
import invoiceRoutes from './invoice.routes';
import expenseRoutes from './expense.routes';
import dashboardRoutes from './dashboard.routes';
import categoryRoutes from './category.routes';
import settingsRoutes from './settings.routes';
import clientRoutes from './client.routes';
import workedHoursRoutes from './worked-hours.routes';

const router = Router();

/**
 * Mount all route modules under their respective paths
 * 
 * All routes are prefixed with /api in the main app
 * So these become:
 * - /api/invoices
 * - /api/expenses
 * - /api/dashboard
 * - /api/categories
 * - /api/settings
 */
router.use('/invoices', invoiceRoutes);
router.use('/expenses', expenseRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/categories', categoryRoutes);
router.use('/settings', settingsRoutes);
router.use('/clients', clientRoutes);
router.use('/worked-hours', workedHoursRoutes);

export default router;

