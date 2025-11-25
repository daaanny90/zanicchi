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

/**
 * GET /api/dashboard/monthly-overview
 * Get monthly overview with salary-based calculations
 * Query params: year, month, targetSalary, taxRate
 */
router.get('/monthly-overview', dashboardController.getMonthlyOverview);

/**
 * GET /api/dashboard/annual-limit
 * Get annual revenue limit status (85,000 € flat-tax regime)
 */
router.get('/annual-limit', dashboardController.getAnnualRevenueLimit);

export default router;

