/**
 * Expense Routes
 * 
 * Defines all HTTP routes for expense management.
 * Maps URL patterns to controller functions.
 */

import { Router } from 'express';
import * as expenseController from '../controllers/expense.controller';

const router = Router();

/**
 * GET /api/expenses
 * Get all expenses (with optional category filter)
 */
router.get('/', expenseController.getAllExpenses);

/**
 * GET /api/expenses/:id
 * Get single expense by ID
 */
router.get('/:id', expenseController.getExpenseById);

/**
 * POST /api/expenses
 * Create new expense
 */
router.post('/', expenseController.createExpense);

/**
 * PUT /api/expenses/:id
 * Update existing expense
 */
router.put('/:id', expenseController.updateExpense);

/**
 * DELETE /api/expenses/:id
 * Delete expense
 */
router.delete('/:id', expenseController.deleteExpense);

export default router;

