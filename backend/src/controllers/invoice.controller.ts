/**
 * Invoice Controller
 * 
 * HTTP request handlers for invoice-related endpoints.
 * Controllers handle:
 * - Request validation and parsing
 * - Calling service layer functions
 * - Formatting and sending responses
 * - Error handling
 */

import { Request, Response } from 'express';
import * as invoiceService from '../services/invoice.service';
import { InvoiceStatus } from '../models/Invoice.model';
import {
  sendSuccess,
  sendError,
  sendNotFound,
  sendCreated,
  sendValidationError
} from '../utils/response.utils';

/**
 * Get all invoices
 * 
 * GET /api/invoices
 * Query params: status (optional)
 */
export async function getAllInvoices(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.query;
    
    // Validate status if provided
    if (status && !Object.values(InvoiceStatus).includes(status as InvoiceStatus)) {
      sendValidationError(res, 'Invalid status value');
      return;
    }
    
    const invoices = await invoiceService.getAllInvoices(status as InvoiceStatus);
    sendSuccess(res, invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    sendError(res, 'Failed to fetch invoices');
  }
}

/**
 * Get single invoice by ID
 * 
 * GET /api/invoices/:id
 */
export async function getInvoiceById(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      sendValidationError(res, 'Invalid invoice ID');
      return;
    }
    
    const invoice = await invoiceService.getInvoiceById(id);
    
    if (!invoice) {
      sendNotFound(res, 'Invoice');
      return;
    }
    
    sendSuccess(res, invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    sendError(res, 'Failed to fetch invoice');
  }
}

/**
 * Create new invoice
 * 
 * POST /api/invoices
 * Body: CreateInvoiceDTO
 */
export async function createInvoice(req: Request, res: Response): Promise<void> {
  try {
    const invoice = await invoiceService.createInvoice(req.body);
    sendCreated(res, invoice, 'Invoice created successfully');
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    
    // Send validation error if it's a known business logic error
    if (error.message.includes('required') || 
        error.message.includes('Invalid') ||
        error.message.includes('already exists')) {
      sendValidationError(res, error.message);
    } else {
      sendError(res, 'Failed to create invoice');
    }
  }
}

/**
 * Update invoice
 * 
 * PUT /api/invoices/:id
 * Body: UpdateInvoiceDTO
 */
export async function updateInvoice(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      sendValidationError(res, 'Invalid invoice ID');
      return;
    }
    
    const invoice = await invoiceService.updateInvoice(id, req.body);
    sendSuccess(res, invoice, 'Invoice updated successfully');
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    
    if (error.message === 'Invoice not found') {
      sendNotFound(res, 'Invoice');
    } else if (error.message.includes('Invalid') || 
               error.message.includes('already exists')) {
      sendValidationError(res, error.message);
    } else {
      sendError(res, 'Failed to update invoice');
    }
  }
}

/**
 * Update invoice status
 * 
 * PATCH /api/invoices/:id/status
 * Body: { status: InvoiceStatus }
 */
export async function updateInvoiceStatus(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    if (isNaN(id)) {
      sendValidationError(res, 'Invalid invoice ID');
      return;
    }
    
    if (!status || !Object.values(InvoiceStatus).includes(status)) {
      sendValidationError(res, 'Invalid or missing status value');
      return;
    }
    
    const invoice = await invoiceService.updateInvoiceStatus(id, status);
    sendSuccess(res, invoice, 'Invoice status updated successfully');
  } catch (error: any) {
    console.error('Error updating invoice status:', error);
    
    if (error.message === 'Invoice not found') {
      sendNotFound(res, 'Invoice');
    } else {
      sendError(res, 'Failed to update invoice status');
    }
  }
}

/**
 * Delete invoice
 * 
 * DELETE /api/invoices/:id
 */
export async function deleteInvoice(req: Request, res: Response): Promise<void> {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      sendValidationError(res, 'Invalid invoice ID');
      return;
    }
    
    await invoiceService.deleteInvoice(id);
    sendSuccess(res, { deleted: true }, 'Invoice deleted successfully');
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    
    if (error.message === 'Invoice not found') {
      sendNotFound(res, 'Invoice');
    } else {
      sendError(res, 'Failed to delete invoice');
    }
  }
}

