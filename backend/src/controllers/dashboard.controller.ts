/**
 * Dashboard Controller
 * 
 * HTTP request handlers for dashboard-related endpoints.
 * Provides aggregated financial data for dashboard visualizations.
 */

import { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service';
import { sendSuccess, sendError, sendValidationError } from '../utils/response.utils';

/**
 * Get dashboard summary
 * 
 * GET /api/dashboard/summary
 * Returns overall financial summary with key metrics
 */
export async function getDashboardSummary(_req: Request, res: Response): Promise<void> {
  try {
    const summary = await dashboardService.getDashboardSummary();
    sendSuccess(res, summary);
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    sendError(res, 'Failed to fetch dashboard summary');
  }
}

/**
 * Get monthly estimate
 * 
 * GET /api/dashboard/monthly-estimate
 * Returns current month financial projection
 */
export async function getMonthlyEstimate(_req: Request, res: Response): Promise<void> {
  try {
    const estimate = await dashboardService.getMonthlyEstimate();
    sendSuccess(res, estimate);
  } catch (error) {
    console.error('Error fetching monthly estimate:', error);
    sendError(res, 'Failed to fetch monthly estimate');
  }
}

/**
 * Get income vs expense chart data
 * 
 * GET /api/dashboard/income-expense-chart
 * Query params: months (optional, default: 6)
 * Returns time-series data for income vs expenses chart
 */
export async function getIncomeExpenseChart(req: Request, res: Response): Promise<void> {
  try {
    // Parse months parameter with default value
    let months = 6;
    if (req.query.months) {
      months = parseInt(req.query.months as string);
      if (isNaN(months) || months < 1 || months > 24) {
        sendValidationError(res, 'Months must be between 1 and 24');
        return;
      }
    }
    
    const chartData = await dashboardService.getIncomeExpenseChartData(months);
    sendSuccess(res, chartData);
  } catch (error) {
    console.error('Error fetching chart data:', error);
    sendError(res, 'Failed to fetch chart data');
  }
}

/**
 * Get expense by category chart data
 * 
 * GET /api/dashboard/expense-by-category
 * Returns expense breakdown by category for pie chart
 */
export async function getExpenseByCategory(_req: Request, res: Response): Promise<void> {
  try {
    const data = await dashboardService.getExpenseByCategoryChartData();
    sendSuccess(res, data);
  } catch (error) {
    console.error('Error fetching expense by category:', error);
    sendError(res, 'Failed to fetch expense by category data');
  }
}

/**
 * Get monthly overview with salary-based calculations
 * 
 * GET /api/dashboard/monthly-overview
 * Query params: year, month, targetSalary, taxRate
 * Returns comprehensive monthly financial overview
 */
export async function getMonthlyOverview(req: Request, res: Response): Promise<void> {
  try {
    // Get current date as defaults
    const now = new Date();
    const year = req.query.year ? parseInt(req.query.year as string) : now.getFullYear();
    const month = req.query.month ? parseInt(req.query.month as string) : now.getMonth() + 1;
    const targetSalary = req.query.targetSalary ? parseFloat(req.query.targetSalary as string) : 3000;
    const taxRate = req.query.taxRate ? parseFloat(req.query.taxRate as string) : 22;
    
    // Validate parameters
    if (isNaN(year) || year < 2000 || year > 2100) {
      sendValidationError(res, 'Invalid year');
      return;
    }
    
    if (isNaN(month) || month < 1 || month > 12) {
      sendValidationError(res, 'Month must be between 1 and 12');
      return;
    }
    
    if (isNaN(targetSalary) || targetSalary < 0) {
      sendValidationError(res, 'Invalid target salary');
      return;
    }
    
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
      sendValidationError(res, 'Tax rate must be between 0 and 100');
      return;
    }
    
    const overview = await dashboardService.getMonthlyOverview(year, month, targetSalary, taxRate);
    sendSuccess(res, overview);
  } catch (error) {
    console.error('Error fetching monthly overview:', error);
    sendError(res, 'Failed to fetch monthly overview');
  }
}

