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
import { calculateNetIncome } from '../utils/calc.utils';
import { getFirstDayOfMonth, getLastDayOfMonth, getLastDayOfSpecificMonth, getDateMonthsAgo } from '../utils/date.utils';

/**
 * Dashboard Summary Interface
 * 
 * High-level financial metrics for dashboard display.
 */
export interface DashboardSummary {
  total_income: number;           // Total from all paid invoices
  total_expenses: number;         // Total from all expenses
  total_tax: number;              // Total tax from all invoices
  net_income: number;             // Income - Expenses - Tax
  pending_invoices: number;       // Amount in sent but unpaid invoices
  overdue_invoices: number;       // Amount in overdue invoices
}

/**
 * Monthly Estimate Interface
 * 
 * Current month financial projection.
 */
export interface MonthlyEstimate {
  month: string;                  // Current month (YYYY-MM)
  total_income: number;           // Income from paid invoices this month
  total_expenses: number;         // Expenses this month
  total_tax: number;              // Tax from paid invoices this month
  net_income: number;             // Estimated net for this month
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
 * 
 * @returns Promise resolving to dashboard summary
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  // Update overdue invoices first
  await updateOverdueInvoices();
  
  // Get invoice summary
  const invoiceSummary = await getInvoiceSummary();
  
  // Get expense summary
  const expenseSummary = await getExpenseSummary();
  
  // Calculate total tax from paid invoices
  const [taxRows] = await db.query<RowDataPacket[]>(
    `SELECT COALESCE(SUM(tax_amount), 0) as total_tax
     FROM invoices
     WHERE status = 'paid'`
  );
  
  const totalTax = taxRows[0].total_tax;
  
  // Calculate net income
  const netIncome = calculateNetIncome(
    invoiceSummary.total_paid,
    expenseSummary.total_amount,
    totalTax
  );
  
  return {
    total_income: invoiceSummary.total_paid,
    total_expenses: expenseSummary.total_amount,
    total_tax: totalTax,
    net_income: netIncome,
    pending_invoices: invoiceSummary.total_pending,
    overdue_invoices: invoiceSummary.total_overdue
  };
}

/**
 * Get monthly estimate
 * 
 * Calculates financial metrics for the current month.
 * This is a projection of how the current month is performing.
 * 
 * @returns Promise resolving to monthly estimate
 */
export async function getMonthlyEstimate(): Promise<MonthlyEstimate> {
  const firstDay = getFirstDayOfMonth();
  const lastDay = getLastDayOfMonth();
  
  // Get current date for month label
  const now = new Date();
  const monthLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // Get income from paid invoices this month
  const [incomeRows] = await db.query<RowDataPacket[]>(
    `SELECT 
      COUNT(*) as invoice_count,
      COALESCE(SUM(amount), 0) as total_income,
      COALESCE(SUM(tax_amount), 0) as total_tax
     FROM invoices
     WHERE status = 'paid'
     AND paid_date BETWEEN ? AND ?`,
    [firstDay, lastDay]
  );
  
  const invoiceCount = incomeRows[0].invoice_count;
  const totalIncome = incomeRows[0].total_income;
  const totalTax = incomeRows[0].total_tax;
  
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
  
  // Calculate net income for the month
  const netIncome = calculateNetIncome(totalIncome, totalExpenses, totalTax);
  
  return {
    month: monthLabel,
    total_income: totalIncome,
    total_expenses: totalExpenses,
    total_tax: totalTax,
    net_income: netIncome,
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
 * Comprehensive monthly financial overview including salary-based calculations.
 */
export interface MonthlyOverview {
  month: string;                    // Month in YYYY-MM format
  total_income: number;             // Total income for the month
  total_expenses: number;           // Total expenses for the month
  total_tax: number;                // Total tax paid/owed for the month
  net_income: number;               // Income - Expenses - Tax
  target_salary: number;            // Target monthly salary from settings
  taxes_to_set_aside: number;      // Amount to set aside for taxes
  savings: number;                  // Amount to save (net_income - target_salary - taxes_to_set_aside)
  invoice_count: number;            // Number of invoices
  expense_count: number;            // Number of expenses
}

/**
 * Get monthly overview with salary-based calculations
 * 
 * Retrieves comprehensive financial data for a specific month including:
 * - Income and expenses
 * - Tax calculations
 * - Amount to set aside for taxes
 * - Savings based on target salary
 * 
 * @param year - The year (e.g., 2024)
 * @param month - The month (1-12)
 * @param targetSalary - Target monthly salary from settings
 * @param taxRate - Tax rate from settings
 * @returns Promise resolving to monthly overview data
 */
export async function getMonthlyOverview(
  year: number, 
  month: number, 
  targetSalary: number,
  taxRate: number
): Promise<MonthlyOverview> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = getLastDayOfSpecificMonth(year, month);
  
  // Get invoices for the month (only paid ones count as income)
  const [invoiceRows] = await db.query<RowDataPacket[]>(
    `SELECT 
       COUNT(*) as invoice_count,
       COALESCE(SUM(amount), 0) as total_income,
       COALESCE(SUM(tax_amount), 0) as total_tax
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
  
  const totalIncome = invoiceRows[0]?.total_income || 0;
  const totalExpenses = expenseRows[0]?.total_expenses || 0;
  const totalTax = invoiceRows[0]?.total_tax || 0;
  const invoiceCount = invoiceRows[0]?.invoice_count || 0;
  const expenseCount = expenseRows[0]?.expense_count || 0;
  
  // Calculate net income (income - expenses - already paid tax)
  const netIncome = totalIncome - totalExpenses - totalTax;
  
  // Calculate taxes to set aside (on remaining net income, if any is left to be taxed)
  // This represents additional tax liability on net profit
  const taxableAmount = Math.max(0, netIncome);
  const taxesToSetAside = (taxableAmount * (taxRate / 100));
  
  // Calculate savings (what's left after taking target salary and setting aside taxes)
  const savings = Math.max(0, netIncome - targetSalary - taxesToSetAside);
  
  return {
    month: `${year}-${String(month).padStart(2, '0')}`,
    total_income: totalIncome,
    total_expenses: totalExpenses,
    total_tax: totalTax,
    net_income: netIncome,
    target_salary: targetSalary,
    taxes_to_set_aside: taxesToSetAside,
    savings: savings,
    invoice_count: invoiceCount,
    expense_count: expenseCount
  };
}

