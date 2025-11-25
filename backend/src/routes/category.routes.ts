/**
 * Category Routes
 * 
 * Defines all HTTP routes for category management.
 * Maps URL patterns to controller functions.
 */

import { Router } from 'express';
import * as categoryController from '../controllers/category.controller';

const router = Router();

/**
 * GET /api/categories
 * Get all categories (with optional type filter)
 */
router.get('/', categoryController.getAllCategories);

/**
 * GET /api/categories/:id
 * Get single category by ID
 */
router.get('/:id', categoryController.getCategoryById);

/**
 * POST /api/categories
 * Create new category
 */
router.post('/', categoryController.createCategory);

/**
 * PUT /api/categories/:id
 * Update existing category
 */
router.put('/:id', categoryController.updateCategory);

/**
 * DELETE /api/categories/:id
 * Delete category
 */
router.delete('/:id', categoryController.deleteCategory);

export default router;

