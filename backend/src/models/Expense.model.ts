/**
 * Expense Model
 * 
 * This file defines the TypeScript interfaces and types for Expense entities.
 * Expenses represent money spent on business-related purchases and services.
 * 
 * The model includes:
 * - Expense interface: Complete expense data structure
 * - CreateExpenseDTO: Data Transfer Object for creating new expenses
 * - UpdateExpenseDTO: Data Transfer Object for updating existing expenses
 * - ExpenseWithCategory: Extended expense data including category details
 */

/**
 * Expense Interface
 * 
 * Represents a complete expense record as stored in the database.
 * Each expense must be associated with a category for reporting purposes.
 */
export interface Expense {
  id: number;
  description: string;          // What was purchased or paid for
  amount: number;               // Expense amount in configured currency
  category_id: number;          // Foreign key to categories table
  expense_date: string;         // Date of expense (YYYY-MM-DD)
  notes: string | null;         // Optional additional notes
  created_at: string;           // Record creation timestamp
  updated_at: string;           // Last update timestamp
}

/**
 * Create Expense DTO (Data Transfer Object)
 * 
 * Used when creating a new expense via API.
 * Excludes auto-generated fields (id, timestamps).
 */
export interface CreateExpenseDTO {
  description: string;
  amount: number;
  category_id: number;          // Must reference an existing category
  expense_date: string;         // Required: YYYY-MM-DD format
  notes?: string;               // Optional notes
}

/**
 * Update Expense DTO
 * 
 * Used when updating an existing expense via API.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdateExpenseDTO {
  description?: string;
  amount?: number;
  category_id?: number;
  expense_date?: string;
  notes?: string;
}

/**
 * Expense With Category
 * 
 * Extended expense data that includes the full category information.
 * Used when displaying expenses in the UI to show category name and color.
 * This is created by joining expenses and categories tables.
 */
export interface ExpenseWithCategory extends Expense {
  category_name: string;        // Name of the expense category
  category_color: string;       // Hex color for UI display
}

/**
 * Expense Summary
 * 
 * Aggregated expense data for dashboard display.
 * Used by dashboard service to show spending metrics.
 */
export interface ExpenseSummary {
  total_expenses: number;       // Total count of all expenses
  total_amount: number;         // Sum of all expense amounts
  by_category: CategoryExpense[]; // Breakdown by category
}

/**
 * Category Expense
 * 
 * Represents total expenses for a specific category.
 * Used in charts and category breakdown displays.
 */
export interface CategoryExpense {
  category_id: number;
  category_name: string;
  category_color: string;
  total_amount: number;         // Sum of expenses in this category
  expense_count: number;        // Number of expenses in this category
  percentage: number;           // Percentage of total expenses
}

