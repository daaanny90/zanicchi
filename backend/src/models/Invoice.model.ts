/**
 * Invoice Model
 * 
 * This file defines the TypeScript interfaces and types for Invoice entities.
 * Invoices represent income from clients and track their payment lifecycle.
 * 
 * The model includes:
 * - Invoice interface: Complete invoice data structure as stored in database
 * - InvoiceStatus: Enum for valid invoice statuses
 * - CreateInvoiceDTO: Data Transfer Object for creating new invoices
 * - UpdateInvoiceDTO: Data Transfer Object for updating existing invoices
 */

/**
 * Invoice Status Enum
 * 
 * Represents the lifecycle of an invoice:
 * - draft: Invoice created but not yet sent to client
 * - sent: Invoice has been sent to client, awaiting payment
 * - paid: Client has paid the invoice
 * - overdue: Invoice is past due_date and still unpaid
 */
export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue'
}

/**
 * Invoice Interface
 * 
 * Represents a complete invoice record as stored in the database.
 * All fields are required except paid_date (only set when status is 'paid').
 */
export interface Invoice {
  id: number;
  invoice_number: string;      // Unique identifier like 'INV-2024-001'
  client_name: string;          // Name of the client who will pay
  description: string | null;   // What service/product was provided
  amount: number;               // Base amount before tax
  tax_rate: number;             // Tax percentage (e.g., 22 for 22%)
  tax_amount: number;           // Calculated tax (amount * tax_rate / 100)
  total_amount: number;         // Final amount (amount + tax_amount)
  status: InvoiceStatus;        // Current invoice status
  issue_date: string;           // Date invoice was created (YYYY-MM-DD)
  due_date: string;             // Payment due date (YYYY-MM-DD)
  paid_date: string | null;     // Actual payment date, null if unpaid
  created_at: string;           // Record creation timestamp
  updated_at: string;           // Last update timestamp
}

/**
 * Create Invoice DTO (Data Transfer Object)
 * 
 * Used when creating a new invoice via API.
 * Excludes auto-generated fields (id, timestamps).
 * Tax amount and total amount are calculated automatically by the service layer.
 */
export interface CreateInvoiceDTO {
  invoice_number: string;
  client_name: string;
  description?: string;         // Optional description
  amount: number;               // Base amount (tax will be calculated)
  tax_rate?: number;            // Optional, uses default from settings if not provided
  status?: InvoiceStatus;       // Optional, defaults to 'draft'
  issue_date: string;           // Required: YYYY-MM-DD format
  due_date: string;             // Required: YYYY-MM-DD format
}

/**
 * Update Invoice DTO
 * 
 * Used when updating an existing invoice via API.
 * All fields are optional - only provided fields will be updated.
 * ID is not included as it's passed separately in the API endpoint.
 */
export interface UpdateInvoiceDTO {
  invoice_number?: string;
  client_name?: string;
  description?: string;
  amount?: number;
  tax_rate?: number;
  status?: InvoiceStatus;
  issue_date?: string;
  due_date?: string;
  paid_date?: string | null;    // Can be set when marking invoice as paid
}

/**
 * Invoice Summary
 * 
 * Aggregated invoice data for dashboard display.
 * Used by dashboard service to show high-level metrics.
 */
export interface InvoiceSummary {
  total_invoices: number;       // Total count of all invoices
  total_amount: number;         // Sum of all invoice amounts
  total_paid: number;           // Sum of paid invoice amounts
  total_pending: number;        // Sum of sent but unpaid invoices
  total_overdue: number;        // Sum of overdue invoice amounts
}

