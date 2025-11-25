-- ============================================================================
-- Freelancer Finance Manager - Sample Data
-- ============================================================================
-- This script provides minimal sample data for demonstration purposes.
-- Just 1-2 example records to show how the application works.
-- ============================================================================

USE freelancer_finance;

-- ============================================================================
-- Sample Invoice
-- ============================================================================
-- One example invoice to demonstrate the system
-- ============================================================================

INSERT INTO invoices (
    invoice_number,
    client_name,
    description,
    amount,
    tax_rate,
    tax_amount,
    total_amount,
    status,
    issue_date,
    due_date,
    paid_date
) VALUES
(
    'INV-2024-001',
    'Cliente Esempio S.r.l.',
    'Sviluppo sito web aziendale',
    3000.00,
    0.00,
    0.00,
    3000.00,
    'paid',
    '2024-11-01',
    '2024-11-30',
    '2024-11-15'
);

-- ============================================================================
-- Sample Expenses
-- ============================================================================
-- Two example expenses to demonstrate different categories
-- ============================================================================

INSERT INTO expenses (description, amount, category_id, expense_date, notes) VALUES
('Abbonamento software di design', 49.99, 1, '2024-11-01', 'Abbonamento mensile'),
('Consulenza commercialista', 150.00, 6, '2024-11-10', 'Consulenza fiscale');

-- ============================================================================
-- Sample data insertion complete
-- ============================================================================
-- You can now run the application and see realistic data in the dashboard
-- ============================================================================

