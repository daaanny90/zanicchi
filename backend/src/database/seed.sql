-- ============================================================================
-- Freelancer Finance Manager - Sample Data
-- ============================================================================
-- This script provides comprehensive sample data for demonstration purposes.
-- Includes realistic examples of invoices, expenses, clients, and worked hours.
-- ============================================================================

USE freelancer_finance;

-- ============================================================================
-- Sample Invoices
-- ============================================================================
-- Example invoices showing different statuses and scenarios
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
    'Studio Creativo Rossi',
    'Sviluppo sito web aziendale - 40 ore',
    3400.00,
    0.00,
    0.00,
    3400.00,
    'paid',
    '2024-10-01',
    '2024-10-30',
    '2024-10-25'
),
(
    'INV-2024-002',
    'TechWave Solutions',
    'Consulenza sviluppo software - Ottobre',
    4800.00,
    0.00,
    0.00,
    4800.00,
    'paid',
    '2024-10-15',
    '2024-11-15',
    '2024-11-10'
),
(
    'INV-2024-003',
    'Studio Creativo Rossi',
    'Sviluppo features aggiuntive - 35 ore',
    2975.00,
    0.00,
    0.00,
    2975.00,
    'sent',
    '2024-11-01',
    '2024-11-30',
    NULL
);

-- ============================================================================
-- Sample Expenses
-- ============================================================================
-- Example expenses across different categories
-- ============================================================================

INSERT INTO expenses (description, amount, category_id, expense_date, notes) VALUES
('Abbonamento Adobe Creative Cloud', 59.99, 1, '2024-10-01', 'Abbonamento mensile'),
('Laptop Dell XPS 15', 1899.00, 2, '2024-10-05', 'Nuovo laptop per sviluppo'),
('Consulenza commercialista Q3', 200.00, 6, '2024-10-10', 'Consulenza fiscale trimestrale'),
('Corso online React Advanced', 149.00, 7, '2024-10-15', 'Piattaforma Udemy'),
('Abbonamento GitHub Pro', 7.00, 1, '2024-11-01', 'Account sviluppatore'),
('Fibra ottica business', 45.00, 9, '2024-11-05', 'Internet veloce per lavoro remoto');

-- ============================================================================
-- Sample Clients (additional to those in init.sql)
-- ============================================================================
-- Add more example clients if they don't exist
-- ============================================================================

INSERT IGNORE INTO clients (name, hourly_rate, notes) VALUES
('Startup Innovativa', 95.00, 'Progetti web e mobile'),
('Agenzia Marketing Verde', 75.00, 'Landing pages e campagne');

-- ============================================================================
-- Sample Worked Hours
-- ============================================================================
-- Realistic worked hours entries with descriptions for different clients
-- ============================================================================

-- Get client IDs for worked hours entries
SET @rossi_id = (SELECT id FROM clients WHERE name = 'Studio Creativo Rossi' LIMIT 1);
SET @techwave_id = (SELECT id FROM clients WHERE name = 'TechWave Solutions' LIMIT 1);

INSERT IGNORE INTO worked_hours (client_id, worked_date, hours, amount_cached, note) VALUES
-- October hours for Studio Creativo Rossi
(@rossi_id, '2024-10-01', 8.0, 680.00, 'Setup progetto e ambiente sviluppo'),
(@rossi_id, '2024-10-02', 6.5, 552.50, 'Sviluppo homepage e navigation'),
(@rossi_id, '2024-10-03', 7.0, 595.00, 'Implementazione form contatti'),
(@rossi_id, '2024-10-08', 5.5, 467.50, 'Integrazione CMS headless'),
(@rossi_id, '2024-10-09', 8.0, 680.00, 'Sezione portfolio e galleria immagini'),
(@rossi_id, '2024-10-10', 5.0, 425.00, 'Testing e bug fixing'),

-- October hours for TechWave Solutions  
(@techwave_id, '2024-10-05', 8.0, 960.00, 'Analisi requisiti nuovo modulo'),
(@techwave_id, '2024-10-07', 6.0, 720.00, 'Design database schema'),
(@techwave_id, '2024-10-12', 8.0, 960.00, 'Sviluppo REST API endpoints'),
(@techwave_id, '2024-10-14', 7.5, 900.00, 'Implementazione autenticazione JWT'),
(@techwave_id, '2024-10-19', 6.0, 720.00, 'Testing e documentazione API'),
(@techwave_id, '2024-10-21', 4.5, 540.00, 'Code review e refactoring'),

-- November hours for Studio Creativo Rossi
(@rossi_id, '2024-11-04', 7.0, 595.00, 'Feature: sistema prenotazioni'),
(@rossi_id, '2024-11-05', 6.5, 552.50, 'Wireframe e mockup nuove pagine'),
(@rossi_id, '2024-11-11', 8.0, 680.00, 'Sviluppo calendario interattivo'),
(@rossi_id, '2024-11-12', 5.5, 467.50, 'Integrazione payment gateway'),
(@rossi_id, '2024-11-18', 8.0, 680.00, 'Testing completo e deploy staging'),

-- November hours for TechWave Solutions
(@techwave_id, '2024-11-06', 8.0, 960.00, 'Sprint planning e task breakdown'),
(@techwave_id, '2024-11-08', 7.0, 840.00, 'Sviluppo dashboard analytics'),
(@techwave_id, '2024-11-13', 6.5, 780.00, 'Ottimizzazione query database'),
(@techwave_id, '2024-11-15', 8.0, 960.00, 'Implementazione notifiche real-time'),
(@techwave_id, '2024-11-20', 5.0, 600.00, 'Bug fixing e performance tuning'),
(@techwave_id, '2024-11-22', 4.5, 540.00, 'Documentazione tecnica');

-- ============================================================================
-- Sample data insertion complete
-- ============================================================================
-- The database now contains realistic sample data spanning multiple months
-- ============================================================================

