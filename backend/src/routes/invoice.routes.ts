/**
 * Invoice Routes
 * 
 * Defines all HTTP routes for invoice management.
 * Maps URL patterns to controller functions.
 */

import { Router } from 'express';
import * as invoiceController from '../controllers/invoice.controller';

const router = Router();

/**
 * GET /api/invoices
 * Get all invoices (with optional status filter)
 */
router.get('/', invoiceController.getAllInvoices);

/**
 * GET /api/invoices/:id
 * Get single invoice by ID
 */
router.get('/:id', invoiceController.getInvoiceById);

/**
 * POST /api/invoices
 * Create new invoice
 */
router.post('/', invoiceController.createInvoice);

/**
 * PUT /api/invoices/:id
 * Update existing invoice
 */
router.put('/:id', invoiceController.updateInvoice);

/**
 * PATCH /api/invoices/:id/status
 * Update invoice status only
 */
router.patch('/:id/status', invoiceController.updateInvoiceStatus);

/**
 * DELETE /api/invoices/:id
 * Delete invoice
 */
router.delete('/:id', invoiceController.deleteInvoice);

export default router;

