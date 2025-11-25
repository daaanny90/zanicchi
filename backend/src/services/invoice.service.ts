/**
 * Invoice Service
 * 
 * Business logic for managing invoices.
 * Handles CRUD operations and business rules for invoice management.
 * 
 * This service:
 * - Automatically calculates tax and total amounts
 * - Validates invoice data
 * - Updates invoice status (including overdue detection)
 * - Provides filtering and querying capabilities
 */

import { RowDataPacket, ResultSetHeader } from 'mysql2';
import db from '../config/database';
import {
  Invoice,
  InvoiceStatus,
  CreateInvoiceDTO,
  UpdateInvoiceDTO,
  InvoiceSummary
} from '../models/Invoice.model';
import { calculateTax, calculateTotal } from '../utils/calc.utils';
import { isValidDateFormat } from '../utils/date.utils';
import { getAllSettings } from './settings.service';

/**
 * Get all invoices
 * 
 * Retrieves all invoices from the database with optional filtering.
 * Invoices are returned in descending order by issue date.
 * 
 * @param status - Optional status filter
 * @returns Promise resolving to array of invoices
 */
export async function getAllInvoices(status?: InvoiceStatus): Promise<Invoice[]> {
  let query = 'SELECT * FROM invoices';
  const params: any[] = [];
  
  // Add status filter if provided
  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY issue_date DESC';
  
  const [rows] = await db.query<RowDataPacket[]>(query, params);
  return rows as Invoice[];
}

/**
 * Get invoice by ID
 * 
 * Retrieves a single invoice by its ID.
 * 
 * @param id - Invoice ID
 * @returns Promise resolving to invoice or null if not found
 */
export async function getInvoiceById(id: number): Promise<Invoice | null> {
  const [rows] = await db.query<RowDataPacket[]>(
    'SELECT * FROM invoices WHERE id = ?',
    [id]
  );
  
  if (rows.length === 0) {
    return null;
  }
  
  return rows[0] as Invoice;
}

/**
 * Create new invoice
 * 
 * Creates a new invoice with automatic tax and total calculation.
 * Uses default tax rate from settings if not provided.
 * 
 * @param data - Invoice data
 * @returns Promise resolving to created invoice
 * @throws Error if validation fails
 */
export async function createInvoice(data: CreateInvoiceDTO): Promise<Invoice> {
  // Validate required fields
  if (!data.invoice_number || !data.client_name || !data.amount) {
    throw new Error('Missing required fields');
  }
  
  if (!data.issue_date || !data.due_date) {
    throw new Error('Issue date and due date are required');
  }
  
  // Validate date formats
  if (!isValidDateFormat(data.issue_date) || !isValidDateFormat(data.due_date)) {
    throw new Error('Invalid date format. Use YYYY-MM-DD');
  }
  
  // Check if invoice number already exists
  const [existing] = await db.query<RowDataPacket[]>(
    'SELECT id FROM invoices WHERE invoice_number = ?',
    [data.invoice_number]
  );
  
  if (existing.length > 0) {
    throw new Error('Invoice number already exists');
  }
  
  // Get tax rate (use provided or default from settings)
  let taxRate = data.tax_rate;
  if (taxRate === undefined) {
    const settings = await getAllSettings();
    taxRate = settings.default_tax_rate;
  }
  
  // Calculate tax and total
  const taxAmount = calculateTax(data.amount, taxRate);
  const totalAmount = calculateTotal(data.amount, taxAmount);
  
  // Set default status
  const status = data.status || InvoiceStatus.DRAFT;
  
  // Insert invoice
  const [result] = await db.query<ResultSetHeader>(
    `INSERT INTO invoices (
      invoice_number, client_name, description, amount, tax_rate,
      tax_amount, total_amount, status, issue_date, due_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.invoice_number,
      data.client_name,
      data.description || null,
      data.amount,
      taxRate,
      taxAmount,
      totalAmount,
      status,
      data.issue_date,
      data.due_date
    ]
  );
  
  // Retrieve and return created invoice
  const invoice = await getInvoiceById(result.insertId);
  
  if (!invoice) {
    throw new Error('Failed to create invoice');
  }
  
  return invoice;
}

/**
 * Update invoice
 * 
 * Updates an existing invoice with new data.
 * Recalculates tax and total if amount or tax rate changes.
 * 
 * @param id - Invoice ID to update
 * @param data - Fields to update
 * @returns Promise resolving to updated invoice
 * @throws Error if invoice not found or validation fails
 */
export async function updateInvoice(
  id: number,
  data: UpdateInvoiceDTO
): Promise<Invoice> {
  // Check if invoice exists
  const invoice = await getInvoiceById(id);
  if (!invoice) {
    throw new Error('Invoice not found');
  }
  
  // Validate dates if provided
  if (data.issue_date && !isValidDateFormat(data.issue_date)) {
    throw new Error('Invalid issue date format. Use YYYY-MM-DD');
  }
  
  if (data.due_date && !isValidDateFormat(data.due_date)) {
    throw new Error('Invalid due date format. Use YYYY-MM-DD');
  }
  
  // Check for invoice number conflicts
  if (data.invoice_number && data.invoice_number !== invoice.invoice_number) {
    const [existing] = await db.query<RowDataPacket[]>(
      'SELECT id FROM invoices WHERE invoice_number = ? AND id != ?',
      [data.invoice_number, id]
    );
    
    if (existing.length > 0) {
      throw new Error('Invoice number already exists');
    }
  }
  
  // Recalculate tax and total if amount or tax rate changes
  let taxAmount = invoice.tax_amount;
  let totalAmount = invoice.total_amount;
  
  const newAmount = data.amount !== undefined ? data.amount : invoice.amount;
  const newTaxRate = data.tax_rate !== undefined ? data.tax_rate : invoice.tax_rate;
  
  if (data.amount !== undefined || data.tax_rate !== undefined) {
    taxAmount = calculateTax(newAmount, newTaxRate);
    totalAmount = calculateTotal(newAmount, taxAmount);
  }
  
  // Build update query
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.invoice_number !== undefined) {
    updates.push('invoice_number = ?');
    values.push(data.invoice_number);
  }
  
  if (data.client_name !== undefined) {
    updates.push('client_name = ?');
    values.push(data.client_name);
  }
  
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description);
  }
  
  if (data.amount !== undefined) {
    updates.push('amount = ?');
    values.push(data.amount);
  }
  
  if (data.tax_rate !== undefined) {
    updates.push('tax_rate = ?');
    values.push(data.tax_rate);
  }
  
  // Always update tax_amount and total_amount if they changed
  if (data.amount !== undefined || data.tax_rate !== undefined) {
    updates.push('tax_amount = ?');
    values.push(taxAmount);
    updates.push('total_amount = ?');
    values.push(totalAmount);
  }
  
  if (data.status !== undefined) {
    updates.push('status = ?');
    values.push(data.status);
  }
  
  if (data.issue_date !== undefined) {
    updates.push('issue_date = ?');
    values.push(data.issue_date);
  }
  
  if (data.due_date !== undefined) {
    updates.push('due_date = ?');
    values.push(data.due_date);
  }
  
  if (data.paid_date !== undefined) {
    updates.push('paid_date = ?');
    values.push(data.paid_date);
  }
  
  // If no updates, return existing invoice
  if (updates.length === 0) {
    return invoice;
  }
  
  // Execute update
  values.push(id);
  await db.query(
    `UPDATE invoices SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  
  // Return updated invoice
  const updated = await getInvoiceById(id);
  
  if (!updated) {
    throw new Error('Failed to update invoice');
  }
  
  return updated;
}

/**
 * Update invoice status
 * 
 * Updates only the status of an invoice.
 * Automatically sets paid_date when status changes to 'paid'.
 * 
 * @param id - Invoice ID
 * @param status - New status
 * @returns Promise resolving to updated invoice
 */
export async function updateInvoiceStatus(
  id: number,
  status: InvoiceStatus
): Promise<Invoice> {
  const updateData: UpdateInvoiceDTO = { status };
  
  // If marking as paid, set paid_date to today
  if (status === InvoiceStatus.PAID) {
    updateData.paid_date = new Date().toISOString().split('T')[0];
  }
  
  return updateInvoice(id, updateData);
}

/**
 * Delete invoice
 * 
 * Deletes an invoice from the database.
 * 
 * @param id - Invoice ID to delete
 * @returns Promise resolving to true if deleted
 * @throws Error if invoice not found
 */
export async function deleteInvoice(id: number): Promise<boolean> {
  const invoice = await getInvoiceById(id);
  if (!invoice) {
    throw new Error('Invoice not found');
  }
  
  await db.query('DELETE FROM invoices WHERE id = ?', [id]);
  return true;
}

/**
 * Update overdue invoices
 * 
 * Automatically marks unpaid invoices as overdue if they're past their due date.
 * This should be called periodically or when loading invoices.
 * 
 * @returns Promise resolving to number of invoices marked overdue
 */
export async function updateOverdueInvoices(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  
  const [result] = await db.query<ResultSetHeader>(
    `UPDATE invoices 
     SET status = ? 
     WHERE status IN (?, ?) 
     AND due_date < ? 
     AND paid_date IS NULL`,
    [InvoiceStatus.OVERDUE, InvoiceStatus.SENT, InvoiceStatus.DRAFT, today]
  );
  
  return result.affectedRows;
}

/**
 * Get invoice summary
 * 
 * Calculates aggregate statistics for all invoices.
 * Used in dashboard displays.
 * 
 * @returns Promise resolving to invoice summary
 */
export async function getInvoiceSummary(): Promise<InvoiceSummary> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT 
      COUNT(*) as total_invoices,
      COALESCE(SUM(total_amount), 0) as total_amount,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0) as total_paid,
      COALESCE(SUM(CASE WHEN status = 'sent' THEN total_amount ELSE 0 END), 0) as total_pending,
      COALESCE(SUM(CASE WHEN status = 'overdue' THEN total_amount ELSE 0 END), 0) as total_overdue
    FROM invoices`
  );
  
  return rows[0] as InvoiceSummary;
}

