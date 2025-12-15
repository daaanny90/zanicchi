/**
 * Expense Controller
 * 
 * HTTP request handlers for expense-related endpoints.
 * Controllers handle:
 * - Request validation and parsing
 * - Calling service layer functions
 * - Formatting and sending responses
 * - Error handling
 */

import { Request, Response } from 'express';
import * as expenseService from '../services/expense.service';
import {
  sendSuccess,
  sendError,
  sendNotFound,
  sendCreated,
  sendValidationError
} from '../utils/response.utils';

/**
 * Get all expenses
 * 
 * GET /api/expenses
 * Query params: category_id (optional), start_date (optional), end_date (optional)
 */
export async function getAllExpenses(req: Request, res: Response): Promise<void> {
  try {
    const categoryId = req.query.category_id ? 
      parseInt(req.query.category_id as string) : 
      undefined;
    
    const startDate = req.query.start_date as string | undefined;
    const endDate = req.query.end_date as string | undefined;
    
    if (categoryId !== undefined && isNaN(categoryId)) {
      sendValidationError(res, 'Invalid category ID');
      return;
    }
    
    const expenses = await expenseService.getAllExpenses({
      categoryId,
      startDate,
      endDate
    });
    sendSuccess(res, expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    sendError(res, 'Failed to fetch expenses');
  }
}

/**
 * Get single expense by ID
 * 
 * GET /api/expenses/:id
 */
export async function getExpenseById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      sendValidationError(res, 'Invalid expense ID');
      return;
    }
    
    const expense = await expenseService.getExpenseById(id);
    
    if (!expense) {
      sendNotFound(res, 'Expense');
      return;
    }
    
    sendSuccess(res, expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    sendError(res, 'Failed to fetch expense');
  }
}

/**
 * Create new expense
 * 
 * POST /api/expenses
 * Body: CreateExpenseDTO
 */
export async function createExpense(req: Request, res: Response): Promise<void> {
  try {
    const expense = await expenseService.createExpense(req.body);
    sendCreated(res, expense, 'Expense created successfully');
  } catch (error: any) {
    console.error('Error creating expense:', error);
    
    // Send validation error if it's a known business logic error
    if (error.message.includes('required') || 
        error.message.includes('Invalid') ||
        error.message.includes('must be')) {
      sendValidationError(res, error.message);
    } else {
      sendError(res, 'Failed to create expense');
    }
  }
}

/**
 * Update expense
 * 
 * PUT /api/expenses/:id
 * Body: UpdateExpenseDTO
 */
export async function updateExpense(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      sendValidationError(res, 'Invalid expense ID');
      return;
    }
    
    const expense = await expenseService.updateExpense(id, req.body);
    sendSuccess(res, expense, 'Expense updated successfully');
  } catch (error: any) {
    console.error('Error updating expense:', error);
    
    if (error.message === 'Expense not found') {
      sendNotFound(res, 'Expense');
    } else if (error.message.includes('Invalid') || 
               error.message.includes('must be')) {
      sendValidationError(res, error.message);
    } else {
      sendError(res, 'Failed to update expense');
    }
  }
}

/**
 * Delete expense
 * 
 * DELETE /api/expenses/:id
 */
export async function deleteExpense(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      sendValidationError(res, 'Invalid expense ID');
      return;
    }
    
    await expenseService.deleteExpense(id);
    sendSuccess(res, { deleted: true }, 'Expense deleted successfully');
  } catch (error: any) {
    console.error('Error deleting expense:', error);
    
    if (error.message === 'Expense not found') {
      sendNotFound(res, 'Expense');
    } else {
      sendError(res, 'Failed to delete expense');
    }
  }
}

