/**
 * Category Controller
 * 
 * HTTP request handlers for category-related endpoints.
 * Categories are used to organize expenses.
 */

import { Request, Response } from 'express';
import * as categoryService from '../services/category.service';
import {
  sendSuccess,
  sendError,
  sendNotFound,
  sendCreated,
  sendValidationError
} from '../utils/response.utils';

/**
 * Get all categories
 * 
 * GET /api/categories
 */
export async function getAllCategories(_req: Request, res: Response): Promise<void> {
  try {
    const categories = await categoryService.getAllCategories();
    sendSuccess(res, categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    sendError(res, 'Failed to fetch categories');
  }
}

/**
 * Get single category by ID
 * 
 * GET /api/categories/:id
 */
export async function getCategoryById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      sendValidationError(res, 'Invalid category ID');
      return;
    }
    
    const category = await categoryService.getCategoryById(id);
    
    if (!category) {
      sendNotFound(res, 'Category');
      return;
    }
    
    sendSuccess(res, category);
  } catch (error) {
    console.error('Error fetching category:', error);
    sendError(res, 'Failed to fetch category');
  }
}

/**
 * Create new category
 * 
 * POST /api/categories
 * Body: CreateCategoryDTO
 */
export async function createCategory(req: Request, res: Response): Promise<void> {
  try {
    const category = await categoryService.createCategory(req.body);
    sendCreated(res, category, 'Category created successfully');
  } catch (error: any) {
    console.error('Error creating category:', error);
    
    // Send validation error for business logic errors
    if (error.message.includes('already exists')) {
      sendValidationError(res, error.message);
    } else {
      sendError(res, 'Failed to create category');
    }
  }
}

/**
 * Update category
 * 
 * PUT /api/categories/:id
 * Body: UpdateCategoryDTO
 */
export async function updateCategory(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      sendValidationError(res, 'Invalid category ID');
      return;
    }
    
    const category = await categoryService.updateCategory(id, req.body);
    sendSuccess(res, category, 'Category updated successfully');
  } catch (error: any) {
    console.error('Error updating category:', error);
    
    if (error.message === 'Category not found') {
      sendNotFound(res, 'Category');
    } else if (error.message.includes('already exists')) {
      sendValidationError(res, error.message);
    } else {
      sendError(res, 'Failed to update category');
    }
  }
}

/**
 * Delete category
 * 
 * DELETE /api/categories/:id
 */
export async function deleteCategory(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      sendValidationError(res, 'Invalid category ID');
      return;
    }
    
    await categoryService.deleteCategory(id);
    sendSuccess(res, { deleted: true }, 'Category deleted successfully');
  } catch (error: any) {
    console.error('Error deleting category:', error);
    
    if (error.message === 'Category not found') {
      sendNotFound(res, 'Category');
    } else if (error.message.includes('associated expenses')) {
      sendValidationError(res, error.message);
    } else {
      sendError(res, 'Failed to delete category');
    }
  }
}

