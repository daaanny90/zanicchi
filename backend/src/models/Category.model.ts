/**
 * Category Model
 * 
 * This file defines the TypeScript interfaces and types for Category entities.
 * Categories are used to organize expenses for better reporting
 * and visualization in charts.
 * 
 * The model includes:
 * - Category interface: Complete category data structure
 * - CreateCategoryDTO: Data Transfer Object for creating new categories
 * - UpdateCategoryDTO: Data Transfer Object for updating existing categories
 * 
 * Note: Categories are only for expenses. An expense is an expense.
 */

/**
 * Category Interface
 * 
 * Represents a complete category record as stored in the database.
 * Categories help organize expenses and enable better reporting and visualization.
 */
export interface Category {
  id: number;
  name: string;                 // Category name (must be unique)
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
  color?: string;               // Optional, defaults to '#3498db'
}

/**
 * Update Category DTO
 * 
 * Used when updating an existing category via API.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdateCategoryDTO {
  name?: string;
  color?: string;
}

