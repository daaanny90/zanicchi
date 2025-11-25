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
    'Sviluppo e design sito web',
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
    'Sviluppo app mobile - Fase 1',
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
    'Sviluppo plugin WordPress personalizzato',
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
    'Integrazione piattaforma e-commerce',
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
    'Sviluppo API e documentazione',
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
    'Sistema di gestione inventario',
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
    'Sviluppo portale pazienti',
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
('Abbonamento Adobe Creative Cloud', 54.99, 1, '2024-09-01', 'Abbonamento mensile software design'),
('Abbonamento GitHub Pro', 4.00, 1, '2024-09-01', 'Hosting repository codice'),
('Sostituzione laptop - MacBook Pro', 2499.00, 2, '2024-09-05', 'Nuova macchina di sviluppo'),
('Sedia da ufficio', 350.00, 2, '2024-09-10', 'Arredamento ufficio ergonomico'),
('Carta e inchiostro stampante', 45.00, 3, '2024-09-12', 'Forniture ufficio'),
('Incontro cliente - pranzo', 85.00, 4, '2024-09-15', 'Incontro sviluppo business'),
('Campagna Google Ads', 200.00, 5, '2024-09-20', 'Marketing per nuovi servizi'),

-- October expenses
('Abbonamento Adobe Creative Cloud', 54.99, 1, '2024-10-01', 'Abbonamento mensile software design'),
('Abbonamento GitHub Pro', 4.00, 1, '2024-10-01', 'Hosting repository codice'),
('Servizi hosting AWS', 125.00, 1, '2024-10-05', 'Costi infrastruttura cloud'),
('Monitor esterno', 450.00, 2, '2024-10-08', 'Display 4K per produttività'),
('Corsi Udemy - React Avanzato', 89.99, 7, '2024-10-12', 'Sviluppo professionale'),
('Premio assicurazione aziendale', 450.00, 8, '2024-10-15', 'Assicurazione responsabilità professionale trimestrale'),
('Servizio internet', 65.00, 9, '2024-10-20', 'Connessione fibra ad alta velocità'),

-- November expenses (current month)
('Abbonamento Adobe Creative Cloud', 54.99, 1, '2024-11-01', 'Abbonamento mensile software design'),
('Abbonamento GitHub Pro', 4.00, 1, '2024-11-01', 'Hosting repository codice'),
('Abbonamento Notion', 10.00, 1, '2024-11-01', 'Strumento gestione progetti'),
('Mouse e tastiera wireless', 120.00, 2, '2024-11-05', 'Aggiornamento periferiche'),
('Quaderno e penne', 25.00, 3, '2024-11-08', 'Forniture per riunioni'),
('Biglietto treno per conferenza', 150.00, 4, '2024-11-10', 'Partecipazione conferenza tech'),
('Iscrizione conferenza', 299.00, 7, '2024-11-10', 'Evento sviluppo professionale'),
('LinkedIn Ads', 150.00, 5, '2024-11-12', 'Campagna generazione lead'),
('Consulenza commercialista', 200.00, 6, '2024-11-15', 'Sessione pianificazione fiscale'),
('Servizio internet', 65.00, 9, '2024-11-20', 'Connessione fibra ad alta velocità'),
('Hard disk backup', 89.99, 2, '2024-11-22', 'Soluzione backup dati');

-- ============================================================================
-- Sample data insertion complete
-- ============================================================================
-- You can now run the application and see realistic data in the dashboard
-- ============================================================================

