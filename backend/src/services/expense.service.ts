/**
 * Expense Service
 * 
 * Business logic for managing business expenses.
 * Handles CRUD operations and provides aggregated expense data
 * for reporting and dashboard displays.
 * 
 * This service:
 * - Manages expense records
 * - Joins with category data for rich display
 * - Provides expense aggregations by category
 * - Validates expense data
 */

import { RowDataPacket, ResultSetHeader } from 'mysql2';
import db from '../config/database';
import {
  ExpenseWithCategory,
  CreateExpenseDTO,
  UpdateExpenseDTO,
  ExpenseSummary,
  CategoryExpense
} from '../models/Expense.model';
import { isValidDateFormat } from '../utils/date.utils';
import { calculatePercentage } from '../utils/calc.utils';
import { getCategoryById } from './category.service';

/**
 * Get all expenses
 * 
 * Retrieves all expenses from the database joined with category information.
 * Returns expenses with category name and color for display purposes.
 * 
 * @param categoryId - Optional category filter
 * @returns Promise resolving to array of expenses with category data
 */
export async function getAllExpenses(categoryId?: number): Promise<ExpenseWithCategory[]> {
  let query = `
    SELECT 
      e.*,
      c.name as category_name,
      c.color as category_color
    FROM expenses e
    INNER JOIN categories c ON e.category_id = c.id
  `;
  
  const params: any[] = [];
  
  // Add category filter if provided
  if (categoryId) {
    query += ' WHERE e.category_id = ?';
    params.push(categoryId);
  }
  
  query += ' ORDER BY e.expense_date DESC';
  
  const [rows] = await db.query<RowDataPacket[]>(query, params);
  return rows as ExpenseWithCategory[];
}

/**
 * Get expense by ID
 * 
 * Retrieves a single expense by its ID, including category information.
 * 
 * @param id - Expense ID
 * @returns Promise resolving to expense or null if not found
 */
export async function getExpenseById(id: number): Promise<ExpenseWithCategory | null> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT 
      e.*,
      c.name as category_name,
      c.color as category_color
    FROM expenses e
    INNER JOIN categories c ON e.category_id = c.id
    WHERE e.id = ?`,
    [id]
  );
  
  if (rows.length === 0) {
    return null;
  }
  
  return rows[0] as ExpenseWithCategory;
}

/**
 * Create new expense
 * 
 * Creates a new expense record in the database.
 * Validates that the category exists before creating.
 * 
 * IVA Calculation:
 * - If iva_included = true: iva_amount = 0 (IVA already in the amount)
 * - If iva_included = false: iva_amount = amount × (iva_rate / 100)
 * 
 * @param data - Expense data
 * @returns Promise resolving to created expense
 * @throws Error if validation fails
 */
export async function createExpense(data: CreateExpenseDTO): Promise<ExpenseWithCategory> {
  // Validate required fields
  if (!data.description || !data.amount || !data.category_id || !data.expense_date) {
    throw new Error('Missing required fields');
  }
  
  // Validate date format
  if (!isValidDateFormat(data.expense_date)) {
    throw new Error('Invalid date format. Use YYYY-MM-DD');
  }
  
  // Validate that category exists
  const category = await getCategoryById(data.category_id);
  if (!category) {
    throw new Error('Invalid category ID');
  }
  
  // Validate amount is positive
  if (data.amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }
  
  // Set defaults for IVA fields
  const ivaIncluded = data.iva_included !== undefined ? data.iva_included : true;
  const ivaRate = data.iva_rate !== undefined ? data.iva_rate : 22;
  
  // Calculate IVA amount
  // If IVA is included, iva_amount = 0 (already paid)
  // If IVA is not included, calculate it: amount × (rate / 100)
  const ivaAmount = ivaIncluded ? 0 : Math.round(data.amount * (ivaRate / 100) * 100) / 100;
  
  // Insert expense
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO expenses (description, amount, category_id, expense_date, notes, iva_included, iva_rate, iva_amount)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.description,
      data.amount,
      data.category_id,
      data.expense_date,
      data.notes || null,
      ivaIncluded,
      ivaRate,
      ivaAmount
    ]
  );
  
  // Retrieve and return created expense
  const expense = await getExpenseById(result.insertId);
  
  if (!expense) {
    throw new Error('Failed to create expense');
  }
  
  return expense;
}

/**
 * Update expense
 * 
 * Updates an existing expense with new data.
 * Only provided fields will be updated.
 * 
 * @param id - Expense ID to update
 * @param data - Fields to update
 * @returns Promise resolving to updated expense
 * @throws Error if expense not found or validation fails
 */
export async function updateExpense(
  id: number,
  data: UpdateExpenseDTO
): Promise<ExpenseWithCategory> {
  // Check if expense exists
  const expense = await getExpenseById(id);
  if (!expense) {
    throw new Error('Expense not found');
  }
  
  // Validate date if provided
  if (data.expense_date && !isValidDateFormat(data.expense_date)) {
    throw new Error('Invalid date format. Use YYYY-MM-DD');
  }
  
  // Validate category if provided
  if (data.category_id) {
    const category = await getCategoryById(data.category_id);
    if (!category) {
      throw new Error('Invalid category ID');
    }
  }
  
  // Validate amount if provided
  if (data.amount !== undefined && data.amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }
  
  // Build update query
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description);
  }
  
  if (data.amount !== undefined) {
    updates.push('amount = ?');
    values.push(data.amount);
  }
  
  if (data.category_id !== undefined) {
    updates.push('category_id = ?');
    values.push(data.category_id);
  }
  
  if (data.expense_date !== undefined) {
    updates.push('expense_date = ?');
    values.push(data.expense_date);
  }
  
  if (data.notes !== undefined) {
    updates.push('notes = ?');
    values.push(data.notes);
  }
  
  if (data.iva_included !== undefined) {
    updates.push('iva_included = ?');
    values.push(data.iva_included);
  }
  
  if (data.iva_rate !== undefined) {
    updates.push('iva_rate = ?');
    values.push(data.iva_rate);
  }
  
  // If no updates, return existing expense
  if (updates.length === 0) {
    return expense;
  }
  
  // Recalculate IVA amount if relevant fields changed
  const newAmount = data.amount !== undefined ? data.amount : expense.amount;
  const newIvaIncluded = data.iva_included !== undefined ? data.iva_included : expense.iva_included;
  const newIvaRate = data.iva_rate !== undefined ? data.iva_rate : expense.iva_rate;
  
  const newIvaAmount = newIvaIncluded ? 0 : Math.round(newAmount * (newIvaRate / 100) * 100) / 100;
  
  updates.push('iva_amount = ?');
  values.push(newIvaAmount);
  
  // Execute update
  values.push(id);
  await db.query(
    `UPDATE expenses SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  
  // Return updated expense
  const updated = await getExpenseById(id);
  
  if (!updated) {
    throw new Error('Failed to update expense');
  }
  
  return updated;
}

/**
 * Delete expense
 * 
 * Deletes an expense from the database.
 * 
 * @param id - Expense ID to delete
 * @returns Promise resolving to true if deleted
 * @throws Error if expense not found
 */
export async function deleteExpense(id: number): Promise<boolean> {
  const expense = await getExpenseById(id);
  if (!expense) {
    throw new Error('Expense not found');
  }
  
  await db.query('DELETE FROM expenses WHERE id = ?', [id]);
  return true;
}

/**
 * Get expense summary
 * 
 * Calculates aggregate statistics for all expenses.
 * Includes breakdown by category with percentages.
 * Used in dashboard displays and reports.
 * 
 * IMPORTANT: Total amount includes IVA for expenses where iva_included = false
 * (amount + iva_amount = actual total cost)
 * 
 * @returns Promise resolving to expense summary
 */
export async function getExpenseSummary(): Promise<ExpenseSummary> {
  // Get total expenses including IVA amounts
  const [totalRows] = await db.query<RowDataPacket[]>(
    `SELECT 
      COUNT(*) as total_expenses,
      COALESCE(SUM(amount + iva_amount), 0) as total_amount
    FROM expenses`
  );
  
  const totalExpenses = totalRows[0].total_expenses;
  const totalAmount = totalRows[0].total_amount;
  
  // Get expenses by category (including IVA)
  const [categoryRows] = await db.query<RowDataPacket[]>(
    `SELECT 
      c.id as category_id,
      c.name as category_name,
      c.color as category_color,
      COALESCE(SUM(e.amount + e.iva_amount), 0) as total_amount,
      COUNT(e.id) as expense_count
    FROM categories c
    LEFT JOIN expenses e ON c.id = e.category_id
    WHERE c.type = 'expense'
    GROUP BY c.id, c.name, c.color
    HAVING expense_count > 0
    ORDER BY total_amount DESC`
  );
  
  // Calculate percentages
  const byCategory: CategoryExpense[] = categoryRows.map((row) => ({
    category_id: row.category_id,
    category_name: row.category_name,
    category_color: row.category_color,
    total_amount: row.total_amount,
    expense_count: row.expense_count,
    percentage: calculatePercentage(row.total_amount, totalAmount)
  }));
  
  return {
    total_expenses: totalExpenses,
    total_amount: totalAmount,
    by_category: byCategory
  };
}

/**
 * Get expenses for date range
 * 
 * Retrieves expenses within a specific date range.
 * Useful for monthly/yearly reports.
 * 
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Promise resolving to array of expenses
 */
export async function getExpensesByDateRange(
  startDate: string,
  endDate: string
): Promise<ExpenseWithCategory[]> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT 
      e.*,
      c.name as category_name,
      c.color as category_color
    FROM expenses e
    INNER JOIN categories c ON e.category_id = c.id
    WHERE e.expense_date BETWEEN ? AND ?
    ORDER BY e.expense_date DESC`,
    [startDate, endDate]
  );
  
  return rows as ExpenseWithCategory[];
}

