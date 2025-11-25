/**
 * Category Service
 * 
 * Business logic for managing expense and income categories.
 * Categories help organize financial transactions and enable
 * better reporting and visualization.
 * 
 * This service handles:
 * - Retrieving all categories
 * - Creating new categories
 * - Updating existing categories
 * - Validation of category data
 */

import { RowDataPacket, ResultSetHeader } from 'mysql2';
import db from '../config/database';
import { Category, CreateCategoryDTO, UpdateCategoryDTO, CategoryType } from '../models/Category.model';

/**
 * Get all categories
 * 
 * Retrieves all categories from the database, optionally filtered by type.
 * 
 * @param type - Optional category type filter ('expense' or 'income')
 * @returns Promise resolving to array of categories
 */
export async function getAllCategories(type?: CategoryType): Promise<Category[]> {
  let query = 'SELECT * FROM categories';
  const params: any[] = [];
  
  // Add type filter if provided
  if (type) {
    query += ' WHERE type = ?';
    params.push(type);
  }
  
  query += ' ORDER BY name ASC';
  
  const [rows] = await db.query<RowDataPacket[]>(query, params);
  return rows as Category[];
}

/**
 * Get category by ID
 * 
 * Retrieves a single category by its ID.
 * 
 * @param id - Category ID
 * @returns Promise resolving to category or null if not found
 */
export async function getCategoryById(id: number): Promise<Category | null> {
  const [rows] = await db.query<RowDataPacket[]>(
    'SELECT * FROM categories WHERE id = ?',
    [id]
  );
  
  if (rows.length === 0) {
    return null;
  }
  
  return rows[0] as Category;
}

/**
 * Create new category
 * 
 * Creates a new category in the database.
 * Validates that the name is unique before creating.
 * 
 * @param data - Category data
 * @returns Promise resolving to created category
 * @throws Error if category name already exists
 */
export async function createCategory(data: CreateCategoryDTO): Promise<Category> {
  // Check if category name already exists
  const [existing] = await db.query<RowDataPacket[]>(
    'SELECT id FROM categories WHERE name = ?',
    [data.name]
  );
  
  if (existing.length > 0) {
    throw new Error('Category name already exists');
  }
  
  // Set defaults
  const type = data.type || CategoryType.EXPENSE;
  const color = data.color || '#3498db';
  
  // Insert new category
  const [result] = await db.query<ResultSetHeader>(
    'INSERT INTO categories (name, type, color) VALUES (?, ?, ?)',
    [data.name, type, color]
  );
  
  // Retrieve and return the created category
  const category = await getCategoryById(result.insertId);
  
  if (!category) {
    throw new Error('Failed to create category');
  }
  
  return category;
}

/**
 * Update category
 * 
 * Updates an existing category with new data.
 * Only provided fields will be updated.
 * 
 * @param id - Category ID to update
 * @param data - Fields to update
 * @returns Promise resolving to updated category
 * @throws Error if category not found or name conflict
 */
export async function updateCategory(
  id: number,
  data: UpdateCategoryDTO
): Promise<Category> {
  // Check if category exists
  const category = await getCategoryById(id);
  if (!category) {
    throw new Error('Category not found');
  }
  
  // If updating name, check for conflicts
  if (data.name && data.name !== category.name) {
    const [existing] = await db.query<RowDataPacket[]>(
      'SELECT id FROM categories WHERE name = ? AND id != ?',
      [data.name, id]
    );
    
    if (existing.length > 0) {
      throw new Error('Category name already exists');
    }
  }
  
  // Build update query dynamically based on provided fields
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  
  if (data.type !== undefined) {
    updates.push('type = ?');
    values.push(data.type);
  }
  
  if (data.color !== undefined) {
    updates.push('color = ?');
    values.push(data.color);
  }
  
  // If no updates, return existing category
  if (updates.length === 0) {
    return category;
  }
  
  // Execute update
  values.push(id);
  await db.query(
    `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  
  // Return updated category
  const updated = await getCategoryById(id);
  
  if (!updated) {
    throw new Error('Failed to update category');
  }
  
  return updated;
}

/**
 * Delete category
 * 
 * Deletes a category from the database.
 * Note: This will fail if there are expenses associated with this category
 * due to foreign key constraints.
 * 
 * @param id - Category ID to delete
 * @returns Promise resolving to true if deleted
 * @throws Error if category not found or has associated expenses
 */
export async function deleteCategory(id: number): Promise<boolean> {
  // Check if category exists
  const category = await getCategoryById(id);
  if (!category) {
    throw new Error('Category not found');
  }
  
  try {
    // Attempt to delete - will fail if there are associated expenses
    await db.query('DELETE FROM categories WHERE id = ?', [id]);
    return true;
  } catch (error: any) {
    // Foreign key constraint violation
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      throw new Error('Cannot delete category that has associated expenses');
    }
    throw error;
  }
}

