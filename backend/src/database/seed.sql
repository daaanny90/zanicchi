-- ============================================================================
-- Freelancer Finance Manager - Sample Data
-- ============================================================================
-- This script provides sample data for testing and demonstration purposes.
-- It creates realistic invoices and expenses to show how the application works.
-- ============================================================================

USE freelancer_finance;

-- ============================================================================
-- Sample Invoices
-- ============================================================================
-- Create sample invoices with various statuses and dates
-- These demonstrate the complete invoice lifecycle
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
-- Paid invoices from previous months
(
    'INV-2024-001',
    'Acme Corporation',
    'Website development and design services',
    5000.00,
    22.00,
    1100.00,
    6100.00,
    'paid',
    '2024-09-01',
    '2024-09-30',
    '2024-09-28'
),
(
    'INV-2024-002',
    'Tech Startup Ltd',
    'Mobile app development - Phase 1',
    8500.00,
    22.00,
    1870.00,
    10370.00,
    'paid',
    '2024-10-01',
    '2024-10-31',
    '2024-10-30'
),
(
    'INV-2024-003',
    'Marketing Agency',
    'Custom WordPress plugin development',
    3200.00,
    22.00,
    704.00,
    3904.00,
    'paid',
    '2024-10-15',
    '2024-11-14',
    '2024-11-10'
),
-- Current month invoices with various statuses
(
    'INV-2024-004',
    'E-commerce Solutions',
    'E-commerce platform integration',
    6500.00,
    22.00,
    1430.00,
    7930.00,
    'paid',
    '2024-11-01',
    '2024-11-30',
    '2024-11-15'
),
(
    'INV-2024-005',
    'Financial Services Co',
    'API development and documentation',
    4200.00,
    22.00,
    924.00,
    5124.00,
    'sent',
    '2024-11-10',
    '2024-12-10',
    NULL
),
(
    'INV-2024-006',
    'Retail Chain Inc',
    'Inventory management system',
    7800.00,
    22.00,
    1716.00,
    9516.00,
    'sent',
    '2024-11-15',
    '2024-12-15',
    NULL
),
-- Draft invoice
(
    'INV-2024-007',
    'Healthcare Provider',
    'Patient portal development',
    5500.00,
    22.00,
    1210.00,
    6710.00,
    'draft',
    '2024-11-20',
    '2024-12-20',
    NULL
);

-- ============================================================================
-- Sample Expenses
-- ============================================================================
-- Create realistic expenses across different categories
-- These span multiple months to show trends in charts
-- ============================================================================

INSERT INTO expenses (description, amount, category_id, expense_date, notes) VALUES
-- September expenses
('Adobe Creative Cloud subscription', 54.99, 1, '2024-09-01', 'Monthly design software subscription'),
('GitHub Pro subscription', 4.00, 1, '2024-09-01', 'Code repository hosting'),
('Laptop replacement - MacBook Pro', 2499.00, 2, '2024-09-05', 'New development machine'),
('Office chair', 350.00, 2, '2024-09-10', 'Ergonomic office furniture'),
('Printer paper and ink', 45.00, 3, '2024-09-12', 'Office supplies'),
('Client meeting - lunch', 85.00, 4, '2024-09-15', 'Business development meeting'),
('Google Ads campaign', 200.00, 5, '2024-09-20', 'Marketing for new services'),

-- October expenses
('Adobe Creative Cloud subscription', 54.99, 1, '2024-10-01', 'Monthly design software subscription'),
('GitHub Pro subscription', 4.00, 1, '2024-10-01', 'Code repository hosting'),
('AWS hosting services', 125.00, 1, '2024-10-05', 'Cloud infrastructure costs'),
('External monitor', 450.00, 2, '2024-10-08', '4K display for productivity'),
('Udemy courses - React Advanced', 89.99, 7, '2024-10-12', 'Professional development'),
('Business insurance premium', 450.00, 8, '2024-10-15', 'Quarterly professional liability insurance'),
('Internet service', 65.00, 9, '2024-10-20', 'High-speed fiber connection'),

-- November expenses (current month)
('Adobe Creative Cloud subscription', 54.99, 1, '2024-11-01', 'Monthly design software subscription'),
('GitHub Pro subscription', 4.00, 1, '2024-11-01', 'Code repository hosting'),
('Notion subscription', 10.00, 1, '2024-11-01', 'Project management tool'),
('Wireless mouse and keyboard', 120.00, 2, '2024-11-05', 'Peripheral upgrades'),
('Notebook and pens', 25.00, 3, '2024-11-08', 'Meeting supplies'),
('Train ticket to conference', 150.00, 4, '2024-11-10', 'Tech conference attendance'),
('Conference registration', 299.00, 7, '2024-11-10', 'Professional development event'),
('LinkedIn Ads', 150.00, 5, '2024-11-12', 'Lead generation campaign'),
('Accountant consultation', 200.00, 6, '2024-11-15', 'Tax planning session'),
('Internet service', 65.00, 9, '2024-11-20', 'High-speed fiber connection'),
('Backup hard drive', 89.99, 2, '2024-11-22', 'Data backup solution');

-- ============================================================================
-- Sample data insertion complete
-- ============================================================================
-- You can now run the application and see realistic data in the dashboard
-- ============================================================================

