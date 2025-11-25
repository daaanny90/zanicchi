/**
 * Category Model
 * 
 * This file defines the TypeScript interfaces and types for Category entities.
 * Categories are used to organize expenses and income for better reporting
 * and visualization in charts.
 * 
 * The model includes:
 * - CategoryType: Enum for category types
 * - Category interface: Complete category data structure
 * - CreateCategoryDTO: Data Transfer Object for creating new categories
 * - UpdateCategoryDTO: Data Transfer Object for updating existing categories
 */

/**
 * Category Type Enum
 * 
 * Determines where a category can be used:
 * - expense: Category for business expenses
 * - income: Category for income/invoices (future expansion)
 */
export enum CategoryType {
  EXPENSE = 'expense',
  INCOME = 'income'
}

/**
 * Category Interface
 * 
 * Represents a complete category record as stored in the database.
 * Categories help organize financial transactions and enable
 * better reporting and visualization.
 */
export interface Category {
  id: number;
  name: string;                 // Category name (must be unique)
  type: CategoryType;           // Whether this is for expenses or income
  color: string;                // Hex color code for charts (e.g., '#3498db')
  created_at: string;           // Record creation timestamp
}

/**
 * Create Category DTO (Data Transfer Object)
 * 
 * Used when creating a new category via API.
 * Excludes auto-generated fields (id, created_at).
 */
export interface CreateCategoryDTO {
  name: string;                 // Must be unique
  type?: CategoryType;          // Optional, defaults to 'expense'
  color?: string;               // Optional, defaults to '#3498db'
}

/**
 * Update Category DTO
 * 
 * Used when updating an existing category via API.
 * All fields are optional - only provided fields will be updated.
 * Note: Changing category type should be done carefully as it may
 * affect existing transactions.
 */
export interface UpdateCategoryDTO {
  name?: string;
  type?: CategoryType;
  color?: string;
}

