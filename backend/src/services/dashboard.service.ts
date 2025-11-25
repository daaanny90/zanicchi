/**
 * Dashboard Service
 * 
 * Business logic for dashboard calculations and aggregations.
 * Provides comprehensive financial overview data combining
 * invoices and expenses for visualization and reporting.
 * 
 * This service:
 * - Calculates monthly net income estimates
 * - Provides time-series data for charts
 * - Aggregates financial metrics
 * - Combines data from multiple sources
 */

import { RowDataPacket } from 'mysql2';
import db from '../config/database';
import { getInvoiceSummary, updateOverdueInvoices } from './invoice.service';
import { getExpenseSummary } from './expense.service';
import { calculateNetIncome, calculateItalianTaxes } from '../utils/calc.utils';
import { getFirstDayOfMonth, getLastDayOfMonth, getLastDayOfSpecificMonth, getDateMonthsAgo } from '../utils/date.utils';

/**
 * Dashboard Summary Interface
 * 
 * High-level financial metrics for dashboard display.
 * 
 * Note: total_vat is the VAT collected from clients (to be paid to government).
 * This is separate from income tax and health insurance contributions.
 */
export interface DashboardSummary {
  total_income: number;           // Total gross income from all paid invoices (excl. VAT)
  total_expenses: number;         // Total from all expenses
  total_vat: number;              // Total VAT collected (to be paid to government)
  taxable_income: number;         // Income × 76% (coefficiente di redditività)
  income_tax: number;             // Income tax owed (15% of taxable income)
  health_insurance: number;       // INPS contribution owed (27% of taxable income)
  total_tax_burden: number;       // Total of income tax + health insurance
  net_income: number;             // Income - Expenses - Income Tax - Health Insurance
  pending_invoices: number;       // Amount in sent but unpaid invoices
  overdue_invoices: number;       // Amount in overdue invoices
}

/**
 * Monthly Estimate Interface
 * 
 * Current month financial projection with Italian tax calculations.
 */
export interface MonthlyEstimate {
  month: string;                  // Current month (YYYY-MM)
  total_income: number;           // Gross income from paid invoices this month (excl. VAT)
  total_expenses: number;         // Expenses this month
  total_vat: number;              // VAT collected (to be paid to government)
  taxable_income: number;         // Income × 76%
  income_tax: number;             // 15% of taxable income
  health_insurance: number;       // 27% of taxable income
  total_tax_burden: number;       // Income tax + health insurance
  net_income: number;             // Income - Expenses - Total tax burden
  invoice_count: number;          // Number of invoices this month
  expense_count: number;          // Number of expenses this month
}

/**
 * Monthly Data Point Interface
 * 
 * Data for a single month in time-series charts.
 */
export interface MonthlyDataPoint {
  month: string;                  // Month label (e.g., "2024-11")
  income: number;                 // Total income for the month
  expenses: number;               // Total expenses for the month
  net: number;                    // Net income for the month
}

/**
 * Get dashboard summary
 * 
 * Retrieves comprehensive financial overview including all key metrics.
 * Updates overdue invoices before calculating to ensure accuracy.
 * Uses Italian "regime forfettario" tax calculation.
 * 
 * @returns Promise resolving to dashboard summary
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  // Update overdue invoices first
  await updateOverdueInvoices();
  
  // Get tax settings
  const [settingsRows] = await db.query<RowDataPacket[]>(
    `SELECT setting_key, setting_value FROM settings 
     WHERE setting_key IN ('taxable_percentage', 'income_tax_rate', 'health_insurance_rate')`
  );
  
  const settings: { [key: string]: number } = {};
  settingsRows.forEach(row => {
    settings[row.setting_key] = parseFloat(row.setting_value);
  });
  
  const taxablePercentage = settings['taxable_percentage'] || 76;
  const incomeTaxRate = settings['income_tax_rate'] || 15;
  const healthInsuranceRate = settings['health_insurance_rate'] || 27;
  
  // Get invoice summary
  const invoiceSummary = await getInvoiceSummary();
  
  // Get expense summary
  const expenseSummary = await getExpenseSummary();
  
  // Calculate total VAT collected from paid invoices (this goes to government)
  const [vatRows] = await db.query<RowDataPacket[]>(
    `SELECT COALESCE(SUM(tax_amount), 0) as total_vat
     FROM invoices
     WHERE status = 'paid'`
  );
  
  const totalVat = vatRows[0].total_vat;
  
  // Calculate Italian taxes using the forfettario regime
  const grossIncome = invoiceSummary.total_paid; // Total from paid invoices (excl. VAT)
  const taxes = calculateItalianTaxes(
    grossIncome,
    taxablePercentage,
    incomeTaxRate,
    healthInsuranceRate
  );
  
  // Calculate net income: Gross Income - Expenses - Income Tax - Health Insurance
  const netIncome = grossIncome - expenseSummary.total_amount - taxes.totalTaxBurden;
  
  return {
    total_income: grossIncome,
    total_expenses: expenseSummary.total_amount,
    total_vat: totalVat,
    taxable_income: taxes.taxableIncome,
    income_tax: taxes.incomeTax,
    health_insurance: taxes.healthInsurance,
    total_tax_burden: taxes.totalTaxBurden,
    net_income: Math.round(netIncome * 100) / 100,
    pending_invoices: invoiceSummary.total_pending,
    overdue_invoices: invoiceSummary.total_overdue
  };
}

/**
 * Get monthly estimate
 * 
 * Calculates financial metrics for the current month.
 * This is a projection of how the current month is performing.
 * Uses Italian "regime forfettario" tax calculation.
 * 
 * @returns Promise resolving to monthly estimate
 */
export async function getMonthlyEstimate(): Promise<MonthlyEstimate> {
  const firstDay = getFirstDayOfMonth();
  const lastDay = getLastDayOfMonth();
  
  // Get current date for month label
  const now = new Date();
  const monthLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // Get tax settings
  const [settingsRows] = await db.query<RowDataPacket[]>(
    `SELECT setting_key, setting_value FROM settings 
     WHERE setting_key IN ('taxable_percentage', 'income_tax_rate', 'health_insurance_rate')`
  );
  
  const settings: { [key: string]: number } = {};
  settingsRows.forEach(row => {
    settings[row.setting_key] = parseFloat(row.setting_value);
  });
  
  const taxablePercentage = settings['taxable_percentage'] || 76;
  const incomeTaxRate = settings['income_tax_rate'] || 15;
  const healthInsuranceRate = settings['health_insurance_rate'] || 27;
  
  // Get income from paid invoices this month
  const [incomeRows] = await db.query<RowDataPacket[]>(
    `SELECT 
      COUNT(*) as invoice_count,
      COALESCE(SUM(amount), 0) as total_income,
      COALESCE(SUM(tax_amount), 0) as total_vat
     FROM invoices
     WHERE status = 'paid'
     AND paid_date BETWEEN ? AND ?`,
    [firstDay, lastDay]
  );
  
  const invoiceCount = incomeRows[0].invoice_count;
  const grossIncome = incomeRows[0].total_income;
  const totalVat = incomeRows[0].total_vat;
  
  // Get expenses for this month
  const [expenseRows] = await db.query<RowDataPacket[]>(
    `SELECT 
      COUNT(*) as expense_count,
      COALESCE(SUM(amount), 0) as total_expenses
     FROM expenses
     WHERE expense_date BETWEEN ? AND ?`,
    [firstDay, lastDay]
  );
  
  const expenseCount = expenseRows[0].expense_count;
  const totalExpenses = expenseRows[0].total_expenses;
  
  // Calculate Italian taxes
  const taxes = calculateItalianTaxes(
    grossIncome,
    taxablePercentage,
    incomeTaxRate,
    healthInsuranceRate
  );
  
  // Calculate net income: Gross Income - Expenses - Total Tax Burden
  const netIncome = grossIncome - totalExpenses - taxes.totalTaxBurden;
  
  return {
    month: monthLabel,
    total_income: grossIncome,
    total_expenses: totalExpenses,
    total_vat: totalVat,
    taxable_income: taxes.taxableIncome,
    income_tax: taxes.incomeTax,
    health_insurance: taxes.healthInsurance,
    total_tax_burden: taxes.totalTaxBurden,
    net_income: Math.round(netIncome * 100) / 100,
    invoice_count: invoiceCount,
    expense_count: expenseCount
  };
}

/**
 * Get income vs expenses chart data
 * 
 * Retrieves monthly income and expense data for the last N months.
 * Used to render time-series charts showing financial trends.
 * 
 * @param months - Number of months to include (default: 6)
 * @returns Promise resolving to array of monthly data points
 */
export async function getIncomeExpenseChartData(months: number = 6): Promise<MonthlyDataPoint[]> {
  const startDate = getDateMonthsAgo(months - 1);
  
  // Get monthly income from paid invoices
  const [incomeRows] = await db.query<RowDataPacket[]>(
    `SELECT 
      DATE_FORMAT(paid_date, '%Y-%m') as month,
      COALESCE(SUM(amount), 0) as income,
      COALESCE(SUM(tax_amount), 0) as tax
     FROM invoices
     WHERE status = 'paid'
     AND paid_date >= ?
     GROUP BY DATE_FORMAT(paid_date, '%Y-%m')
     ORDER BY month ASC`,
    [startDate]
  );
  
  // Get monthly expenses
  const [expenseRows] = await db.query<RowDataPacket[]>(
    `SELECT 
      DATE_FORMAT(expense_date, '%Y-%m') as month,
      COALESCE(SUM(amount), 0) as expenses
     FROM expenses
     WHERE expense_date >= ?
     GROUP BY DATE_FORMAT(expense_date, '%Y-%m')
     ORDER BY month ASC`,
    [startDate]
  );
  
  // Create a map of income by month
  const incomeMap = new Map<string, { income: number; tax: number }>();
  incomeRows.forEach((row) => {
    incomeMap.set(row.month, {
      income: row.income,
      tax: row.tax
    });
  });
  
  // Create a map of expenses by month
  const expenseMap = new Map<string, number>();
  expenseRows.forEach((row) => {
    expenseMap.set(row.month, row.expenses);
  });
  
  // Generate all months in the range
  const result: MonthlyDataPoint[] = [];
  const now = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const incomeData = incomeMap.get(monthLabel);
    const income = incomeData?.income || 0;
    const tax = incomeData?.tax || 0;
    const expenses = expenseMap.get(monthLabel) || 0;
    
    // Calculate net (income - expenses - tax)
    const net = calculateNetIncome(income, expenses, tax);
    
    result.push({
      month: monthLabel,
      income,
      expenses,
      net
    });
  }
  
  return result;
}

/**
 * Get expense by category chart data
 * 
 * Retrieves expense breakdown by category for pie/donut charts.
 * Includes only categories that have expenses.
 * 
 * @returns Promise resolving to expense summary with category breakdown
 */
export async function getExpenseByCategoryChartData() {
  return getExpenseSummary();
}

/**
 * Monthly Overview with Salary Calculations Interface
 * 
 * Comprehensive monthly financial overview including Italian tax calculations
 * and salary-based savings calculations.
 */
export interface MonthlyOverview {
  month: string;                    // Month in YYYY-MM format
  total_income: number;             // Gross income for the month (excl. VAT)
  total_expenses: number;           // Total expenses for the month
  total_vat: number;                // VAT collected (to be paid to government)
  taxable_income: number;           // Income × 76% (coefficiente)
  income_tax: number;               // 15% of taxable income
  health_insurance: number;         // 27% of taxable income
  total_tax_burden: number;         // Income tax + health insurance
  net_income: number;               // Income - Expenses - Total tax burden
  target_salary: number;            // Target monthly salary from settings
  savings: number;                  // Amount to save (net_income - target_salary)
  invoice_count: number;            // Number of invoices
  expense_count: number;            // Number of expenses
}

/**
 * Get monthly overview with salary-based calculations
 * 
 * Retrieves comprehensive financial data for a specific month including:
 * - Income and expenses
 * - Italian "regime forfettario" tax calculations
 * - Savings based on target salary
 * 
 * @param year - The year (e.g., 2024)
 * @param month - The month (1-12)
 * @param targetSalary - Target monthly salary from settings
 * @param taxablePercentage - Percentage of income that is taxable (e.g., 76)
 * @param incomeTaxRate - Income tax rate (e.g., 15)
 * @param healthInsuranceRate - Health insurance rate (e.g., 27)
 * @returns Promise resolving to monthly overview data
 */
export async function getMonthlyOverview(
  year: number, 
  month: number, 
  targetSalary: number,
  taxablePercentage: number,
  incomeTaxRate: number,
  healthInsuranceRate: number
): Promise<MonthlyOverview> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = getLastDayOfSpecificMonth(year, month);
  
  // Get invoices for the month (only paid ones count as income)
  const [invoiceRows] = await db.query<RowDataPacket[]>(
    `SELECT 
       COUNT(*) as invoice_count,
       COALESCE(SUM(amount), 0) as total_income,
       COALESCE(SUM(tax_amount), 0) as total_vat
     FROM invoices 
     WHERE status = 'paid' 
       AND paid_date >= ? 
       AND paid_date <= ?`,
    [startDate, endDate]
  );
  
  // Get expenses for the month
  const [expenseRows] = await db.query<RowDataPacket[]>(
    `SELECT 
       COUNT(*) as expense_count,
       COALESCE(SUM(amount), 0) as total_expenses
     FROM expenses 
     WHERE expense_date >= ? 
       AND expense_date <= ?`,
    [startDate, endDate]
  );
  
  const grossIncome = invoiceRows[0]?.total_income || 0;
  const totalExpenses = expenseRows[0]?.total_expenses || 0;
  const totalVat = invoiceRows[0]?.total_vat || 0;
  const invoiceCount = invoiceRows[0]?.invoice_count || 0;
  const expenseCount = expenseRows[0]?.expense_count || 0;
  
  // Calculate Italian taxes
  const taxes = calculateItalianTaxes(
    grossIncome,
    taxablePercentage,
    incomeTaxRate,
    healthInsuranceRate
  );
  
  // Calculate net income: Gross Income - Expenses - Total Tax Burden
  const netIncome = grossIncome - totalExpenses - taxes.totalTaxBurden;
  
  // Calculate savings: what's left after taking the target salary
  const savings = Math.max(0, netIncome - targetSalary);
  
  return {
    month: `${year}-${String(month).padStart(2, '0')}`,
    total_income: grossIncome,
    total_expenses: totalExpenses,
    total_vat: totalVat,
    taxable_income: taxes.taxableIncome,
    income_tax: taxes.incomeTax,
    health_insurance: taxes.healthInsurance,
    total_tax_burden: taxes.totalTaxBurden,
    net_income: Math.round(netIncome * 100) / 100,
    target_salary: targetSalary,
    savings: Math.round(savings * 100) / 100,
    invoice_count: invoiceCount,
    expense_count: expenseCount
  };
}

