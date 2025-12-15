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
 * Query params: year (optional, defaults to current year)
 * Returns overall financial summary with key metrics
 */
export async function getDashboardSummary(req: Request, res: Response): Promise<void> {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    
    if (year !== undefined && (isNaN(year) || year < 2000 || year > 2100)) {
      sendValidationError(res, 'Invalid year');
      return;
    }
    
    const summary = await dashboardService.getDashboardSummary(year);
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
 * Query params: months (optional, default: 6), year (optional)
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
    
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    
    if (year !== undefined && (isNaN(year) || year < 2000 || year > 2100)) {
      sendValidationError(res, 'Invalid year');
      return;
    }
    
    const chartData = await dashboardService.getIncomeExpenseChartData(months, year);
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
 * Query params: year (optional)
 * Returns expense breakdown by category for pie chart
 */
export async function getExpenseByCategory(req: Request, res: Response): Promise<void> {
  try {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    
    if (year !== undefined && (isNaN(year) || year < 2000 || year > 2100)) {
      sendValidationError(res, 'Invalid year');
      return;
    }
    
    const data = await dashboardService.getExpenseByCategoryChartData(year);
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
 * Query params: year, month, targetSalary, taxablePercentage, incomeTaxRate, healthInsuranceRate
 * Returns comprehensive monthly financial overview with Italian tax calculations
 */
export async function getMonthlyOverview(req: Request, res: Response): Promise<void> {
  try {
    // Get current date as defaults
    const now = new Date();
    const year = req.query.year ? parseInt(req.query.year as string) : now.getFullYear();
    const month = req.query.month ? parseInt(req.query.month as string) : now.getMonth() + 1;
    const targetSalary = req.query.targetSalary ? parseFloat(req.query.targetSalary as string) : 3000;
    const taxablePercentage = req.query.taxablePercentage ? parseFloat(req.query.taxablePercentage as string) : 76;
    const incomeTaxRate = req.query.incomeTaxRate ? parseFloat(req.query.incomeTaxRate as string) : 15;
    const healthInsuranceRate = req.query.healthInsuranceRate ? parseFloat(req.query.healthInsuranceRate as string) : 27;
    
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
    
    if (isNaN(taxablePercentage) || taxablePercentage < 0 || taxablePercentage > 100) {
      sendValidationError(res, 'Taxable percentage must be between 0 and 100');
      return;
    }
    
    if (isNaN(incomeTaxRate) || incomeTaxRate < 0 || incomeTaxRate > 100) {
      sendValidationError(res, 'Income tax rate must be between 0 and 100');
      return;
    }
    
    if (isNaN(healthInsuranceRate) || healthInsuranceRate < 0 || healthInsuranceRate > 100) {
      sendValidationError(res, 'Health insurance rate must be between 0 and 100');
      return;
    }
    
    const overview = await dashboardService.getMonthlyOverview(
      year, 
      month, 
      targetSalary, 
      taxablePercentage, 
      incomeTaxRate, 
      healthInsuranceRate
    );
    sendSuccess(res, overview);
  } catch (error) {
    console.error('Error fetching monthly overview:', error);
    sendError(res, 'Failed to fetch monthly overview');
  }
}

/**
 * Get annual revenue limit status
 * 
 * GET /api/dashboard/annual-limit
 * Returns total invoiced revenue for the year vs the 85,000 € flat-tax limit
 */
export async function getAnnualRevenueLimit(_req: Request, res: Response): Promise<void> {
  try {
    const limitData = await dashboardService.getAnnualRevenueLimit();
    sendSuccess(res, limitData);
  } catch (error) {
    console.error('Error fetching annual revenue limit:', error);
    sendError(res, 'Failed to fetch annual revenue limit');
  }
}

