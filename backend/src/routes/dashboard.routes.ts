/**
 * Dashboard Routes
 * 
 * Defines all HTTP routes for dashboard data.
 * Provides aggregated financial data and chart information.
 */

import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';

const router = Router();

/**
 * GET /api/dashboard/summary
 * Get overall financial summary
 */
router.get('/summary', dashboardController.getDashboardSummary);

/**
 * GET /api/dashboard/monthly-estimate
 * Get current month financial estimate
 */
router.get('/monthly-estimate', dashboardController.getMonthlyEstimate);

/**
 * GET /api/dashboard/income-expense-chart
 * Get time-series data for income vs expenses chart
 */
router.get('/income-expense-chart', dashboardController.getIncomeExpenseChart);

/**
 * GET /api/dashboard/expense-by-category
 * Get expense breakdown by category
 */
router.get('/expense-by-category', dashboardController.getExpenseByCategory);

export default router;

