-- ============================================================================
-- Freelancer Finance Manager - Database Schema
-- ============================================================================
-- This script initializes the database schema for the freelancer financial
-- management application. It creates all necessary tables with proper
-- constraints, indexes, and relationships.
-- ============================================================================
-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS freelancer_finance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE freelancer_finance;
-- ============================================================================
-- Table: categories
-- ============================================================================
-- Stores expense and income categories for organizing financial transactions.
-- Categories help with reporting and visualization (pie charts, filtering).
-- The 'color' field stores hex colors for chart rendering.
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    -- Type: 'expense' or 'income' - determines where this category can be used
    type ENUM('expense', 'income') NOT NULL DEFAULT 'expense',
    -- Color in hex format (e.g., '#3498db') for chart visualization
    color VARCHAR(7) NOT NULL DEFAULT '#3498db',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category_type (type)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- ============================================================================
-- Table: invoices
-- ============================================================================
-- Stores all invoice records with complete lifecycle tracking.
-- Invoices represent income from clients and track their payment status.
-- Tax is calculated and stored to maintain historical accuracy even if
-- tax rates change over time.
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- Unique invoice number for client communication (e.g., 'INV-2024-001')
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    -- Client name who will pay the invoice
    client_name VARCHAR(200) NOT NULL,
    -- Service or product description
    description TEXT,
    -- Base amount before tax (in the app's configured currency)
    amount DECIMAL(10, 2) NOT NULL,
    -- Tax rate percentage applied to this invoice (e.g., 22.00 for 22%)
    tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 22.00,
    -- Calculated tax amount (amount * tax_rate / 100)
    tax_amount DECIMAL(10, 2) NOT NULL,
    -- Total amount including tax (amount + tax_amount)
    total_amount DECIMAL(10, 2) NOT NULL,
    -- Invoice status lifecycle: draft -> sent -> paid (or overdue if past due_date)
    status ENUM('draft', 'sent', 'paid', 'overdue') NOT NULL DEFAULT 'draft',
    -- Date when invoice was issued to client
    issue_date DATE NOT NULL,
    -- Expected payment due date
    due_date DATE NOT NULL,
    -- Actual date when payment was received (NULL if not yet paid)
    paid_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Indexes for common queries
    INDEX idx_invoice_status (status),
    INDEX idx_invoice_issue_date (issue_date),
    INDEX idx_invoice_due_date (due_date),
    INDEX idx_invoice_paid_date (paid_date),
    -- Composite index for date range queries on dashboard
    INDEX idx_invoice_dates (issue_date, status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- ============================================================================
-- Table: expenses
-- ============================================================================
-- Tracks all business-related expenses for the freelance activity.
-- Expenses reduce net income and are categorized for better reporting.
-- ============================================================================
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- Description of what was purchased or paid for
    description VARCHAR(500) NOT NULL,
    -- Expense amount in the app's configured currency
    amount DECIMAL(10, 2) NOT NULL,
    -- Foreign key to categories table
    category_id INT NOT NULL,
    -- Date when the expense occurred
    expense_date DATE NOT NULL,
    -- Optional notes for additional context
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Foreign key constraint to ensure referential integrity
    CONSTRAINT fk_expense_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT -- Prevent deletion of categories that have expenses
    ON UPDATE CASCADE,
    -- Indexes for common queries
    INDEX idx_expense_date (expense_date),
    INDEX idx_expense_category (category_id),
    -- Composite index for category-based date range queries
    INDEX idx_expense_category_date (category_id, expense_date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- ============================================================================
-- Table: settings
-- ============================================================================
-- Stores application configuration as key-value pairs.
-- This allows for flexible configuration without code changes.
-- Settings include tax rates, currency preferences, and other app configs.
-- ============================================================================
CREATE TABLE IF NOT EXISTS settings (
    -- Setting key (e.g., 'default_tax_rate', 'currency')
    setting_key VARCHAR(100) PRIMARY KEY,
    -- Setting value stored as text (convert as needed in application)
    setting_value TEXT NOT NULL,
    -- Human-readable description of what this setting does
    description TEXT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- ============================================================================
-- Initial Data: Default Settings
-- ============================================================================
-- Insert default configuration values
-- Settings for Italian "Regime forfettario" (flat-rate tax regime):
-- - taxable_percentage: Percentage of income that is taxable (coefficiente di redditività)
-- - income_tax_rate: Flat tax rate applied to taxable income
-- - health_insurance_rate: INPS contribution rate applied to taxable income
-- ============================================================================
INSERT INTO settings (setting_key, setting_value, description)
VALUES (
        'default_vat_rate',
        '22',
        'Default VAT/IVA rate percentage for new invoices (not income tax)'
    ),
    (
        'currency',
        'EUR',
        'Currency code used throughout the application (EUR, USD, GBP, etc.)'
    ),
    (
        'currency_symbol',
        '€',
        'Currency symbol for display purposes'
    ),
    (
        'target_salary',
        '3000',
        'Target monthly salary (net amount to take home after taxes and savings)'
    ),
    (
        'taxable_percentage',
        '67',
        'Percentage of income that is taxable (regime forfettario coefficient)'
    ),
    (
        'income_tax_rate',
        '15',
        'Income tax rate percentage (regime forfettario flat tax - 15% standard, 5% first 5 years)'
    ),
    (
        'health_insurance_rate',
        '26.07',
        'Health insurance (INPS Gestione Separata) contribution rate percentage'
    ) ON DUPLICATE KEY
UPDATE setting_value =
VALUES(setting_value);
-- ============================================================================
-- Initial Data: Default Expense Categories
-- ============================================================================
-- Pre-populate common expense categories for freelancers
-- Colors chosen for visual distinction in charts
-- ============================================================================
INSERT INTO categories (name, type, color)
VALUES -- Expense categories
    ('Software e Abbonamenti', 'expense', '#3498db'),
    -- Blue
    ('Attrezzature e Hardware', 'expense', '#e74c3c'),
    -- Red
    ('Forniture Ufficio', 'expense', '#2ecc71'),
    -- Green
    ('Viaggi e Trasporti', 'expense', '#f39c12'),
    -- Orange
    ('Marketing e Pubblicità', 'expense', '#9b59b6'),
    -- Purple
    ('Servizi Professionali', 'expense', '#1abc9c'),
    -- Turquoise
    ('Formazione e Istruzione', 'expense', '#34495e'),
    -- Dark gray
    ('Assicurazioni', 'expense', '#e67e22'),
    -- Dark orange
    ('Utenze e Internet', 'expense', '#95a5a6'),
    -- Light gray
    ('Varie', 'expense', '#7f8c8d') -- Medium gray
    ON DUPLICATE KEY
UPDATE name =
VALUES(name);
-- ============================================================================
-- Table: clients
-- ============================================================================
-- Stores client information for tracking worked hours and billing rates.
-- ============================================================================
CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- ============================================================================
-- Table: worked_hours
-- ============================================================================
-- Stores manually logged worked hours linked to clients.
-- ============================================================================
CREATE TABLE IF NOT EXISTS worked_hours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    worked_date DATE NOT NULL,
    hours DECIMAL(5, 2) NOT NULL,
    amount_cached DECIMAL(10, 2) NOT NULL,
    note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_worked_hours_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_worked_date (worked_date),
    INDEX idx_worked_client_date (client_id, worked_date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
-- ============================================================================
-- Sample Clients
-- ============================================================================
INSERT INTO clients (name, hourly_rate, notes)
VALUES (
        'Studio Creativo Rossi',
        85.00,
        'Progetti di design ricorrenti'
    ),
    (
        'TechWave Solutions',
        120.00,
        'Sviluppo software su base mensile'
    ) ON DUPLICATE KEY
UPDATE hourly_rate =
VALUES(hourly_rate),
    notes =
VALUES(notes);
-- ============================================================================
-- Sample Worked Hours
-- ============================================================================
INSERT INTO worked_hours (
        client_id,
        worked_date,
        hours,
        amount_cached,
        note
    )
VALUES (
        (
            SELECT id
            FROM clients
            WHERE name = 'Studio Creativo Rossi'
        ),
        '2024-11-05',
        6.50,
        552.50,
        'Wireframe homepage'
    ),
    (
        (
            SELECT id
            FROM clients
            WHERE name = 'TechWave Solutions'
        ),
        '2024-11-12',
        4.00,
        480.00,
        'Integrazione API backend'
    ) ON DUPLICATE KEY
UPDATE hours =
VALUES(hours),
    amount_cached =
VALUES(amount_cached),
    note =
VALUES(note);
-- ============================================================================
-- Database initialization complete
-- ============================================================================