-- ============================================================================
-- Freelancer Finance Manager - Database Migration Script
-- ============================================================================
-- This script safely updates the database schema to the latest version.
-- It's designed to be idempotent - can be run multiple times safely.
-- All operations check for existence before making changes.
-- ============================================================================

USE freelancer_finance;

-- ============================================================================
-- Step 1: Ensure all base tables exist first
-- ============================================================================
-- Create tables if they don't exist (safe, idempotent)
-- Must be done BEFORE any ALTER operations or INSERT operations
-- ============================================================================

-- Ensure categories table exists
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type ENUM('expense', 'income') NOT NULL DEFAULT 'expense',
    color VARCHAR(7) NOT NULL DEFAULT '#3498db',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category_type (type)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Ensure settings table exists
CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    description TEXT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Ensure invoices table exists
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    client_name VARCHAR(200) NOT NULL,
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 22.00,
    tax_amount DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('draft', 'sent', 'paid', 'overdue') NOT NULL DEFAULT 'draft',
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_invoice_status (status),
    INDEX idx_invoice_issue_date (issue_date),
    INDEX idx_invoice_due_date (due_date),
    INDEX idx_invoice_paid_date (paid_date),
    INDEX idx_invoice_dates (issue_date, status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Ensure expenses table exists
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(500) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category_id INT NOT NULL,
    expense_date DATE NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_expense_date (expense_date),
    INDEX idx_expense_category (category_id),
    INDEX idx_expense_category_date (category_id, expense_date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Add foreign key for expenses if it doesn't exist
SET @fk_expense_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'expenses' 
    AND CONSTRAINT_NAME = 'fk_expense_category');

SET @add_expense_fk = IF(@fk_expense_exists = 0, 
    'ALTER TABLE expenses ADD CONSTRAINT fk_expense_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE;',
    'SELECT "Expense foreign key already exists" AS Info;');

PREPARE add_expense_fk_stmt FROM @add_expense_fk;
EXECUTE add_expense_fk_stmt;
DEALLOCATE PREPARE add_expense_fk_stmt;

-- Ensure clients table exists with all required fields
CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Ensure worked_hours table exists with all required fields
CREATE TABLE IF NOT EXISTS worked_hours (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    worked_date DATE NOT NULL,
    hours DECIMAL(5, 2) NOT NULL,
    amount_cached DECIMAL(10, 2) NOT NULL,
    note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_worked_date (worked_date),
    INDEX idx_worked_client_date (client_id, worked_date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Add foreign key constraint if it doesn't exist
-- (MariaDB/MySQL will ignore if already exists)
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'worked_hours' 
    AND CONSTRAINT_NAME = 'fk_worked_hours_client');

SET @add_fk = IF(@fk_exists = 0, 
    'ALTER TABLE worked_hours ADD CONSTRAINT fk_worked_hours_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT ON UPDATE CASCADE;',
    'SELECT "Foreign key already exists" AS Info;');

PREPARE add_fk_stmt FROM @add_fk;
EXECUTE add_fk_stmt;
DEALLOCATE PREPARE add_fk_stmt;

-- ============================================================================
-- Step 2: Add any missing columns to existing tables
-- ============================================================================
-- Check and add 'note' column if it doesn't exist
-- ============================================================================

SET @dbname = DATABASE();
SET @tablename = 'worked_hours';
SET @columnname = 'note';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT "Column note already exists" AS Info;',
  'ALTER TABLE worked_hours ADD COLUMN note TEXT NULL AFTER amount_cached;'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- Step 3: Ensure all default settings exist
-- ============================================================================
-- Insert new settings if they don't exist (using INSERT IGNORE)
-- ============================================================================

INSERT IGNORE INTO settings (setting_key, setting_value, description)
VALUES
    ('default_vat_rate', '22', 'Default VAT/IVA rate percentage for new invoices (not income tax)'),
    ('currency', 'EUR', 'Currency code used throughout the application (EUR, USD, GBP, etc.)'),
    ('currency_symbol', '€', 'Currency symbol for display purposes'),
    ('target_salary', '3000', 'Target monthly salary (net amount to take home after taxes and savings)'),
    ('taxable_percentage', '67', 'Percentage of income that is taxable (regime forfettario coefficient)'),
    ('income_tax_rate', '15', 'Income tax rate percentage (regime forfettario flat tax - 15% standard, 5% first 5 years)'),
    ('health_insurance_rate', '26.07', 'Health insurance (INPS Gestione Separata) contribution rate percentage');

-- ============================================================================
-- Step 4: Ensure all default categories exist
-- ============================================================================
-- Insert default categories if they don't exist
-- ============================================================================

-- First ensure type column exists before inserting (for backwards compatibility)
SET @sql = (SELECT IF(
    EXISTS(
        SELECT * FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = 'freelancer_finance'
        AND TABLE_NAME = 'categories'
        AND COLUMN_NAME = 'type'
    ),
    "INSERT IGNORE INTO categories (name, type, color) VALUES
    ('Software e Abbonamenti', 'expense', '#3498db'),
    ('Attrezzature e Hardware', 'expense', '#e74c3c'),
    ('Forniture Ufficio', 'expense', '#2ecc71'),
    ('Viaggi e Trasporti', 'expense', '#f39c12'),
    ('Marketing e Pubblicità', 'expense', '#9b59b6'),
    ('Servizi Professionali', 'expense', '#1abc9c'),
    ('Formazione e Istruzione', 'expense', '#34495e'),
    ('Assicurazioni', 'expense', '#e67e22'),
    ('Utenze e Internet', 'expense', '#95a5a6'),
    ('Varie', 'expense', '#7f8c8d');",
    "INSERT IGNORE INTO categories (name, color) VALUES
    ('Software e Abbonamenti', '#3498db'),
    ('Attrezzature e Hardware', '#e74c3c'),
    ('Forniture Ufficio', '#2ecc71'),
    ('Viaggi e Trasporti', '#f39c12'),
    ('Marketing e Pubblicità', '#9b59b6'),
    ('Servizi Professionali', '#1abc9c'),
    ('Formazione e Istruzione', '#34495e'),
    ('Assicurazioni', '#e67e22'),
    ('Utenze e Internet', '#95a5a6'),
    ('Varie', '#7f8c8d');"
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- Step 7: Add IVA tracking fields to expenses table
-- ============================================================================
-- Add support for tracking IVA (VAT) on expenses.
-- This is needed for B2B purchases from other EU countries where reverse
-- charge applies - the seller doesn't charge IVA, but you need to pay it.
-- ============================================================================

-- Add iva_included field (whether IVA is already in the amount)
SET @sql = (SELECT IF(
    EXISTS(
        SELECT * FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = 'freelancer_finance'
        AND TABLE_NAME = 'expenses'
        AND COLUMN_NAME = 'iva_included'
    ),
    'SELECT "Column iva_included already exists" AS Info;',
    'ALTER TABLE expenses ADD COLUMN iva_included BOOLEAN NOT NULL DEFAULT TRUE COMMENT "Whether IVA is already included in the amount";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add iva_rate field (IVA percentage to apply)
SET @sql = (SELECT IF(
    EXISTS(
        SELECT * FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = 'freelancer_finance'
        AND TABLE_NAME = 'expenses'
        AND COLUMN_NAME = 'iva_rate'
    ),
    'SELECT "Column iva_rate already exists" AS Info;',
    'ALTER TABLE expenses ADD COLUMN iva_rate DECIMAL(5, 2) NOT NULL DEFAULT 22.00 COMMENT "IVA rate percentage (e.g., 22.00 for 22%)";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add iva_amount field (calculated IVA amount)
SET @sql = (SELECT IF(
    EXISTS(
        SELECT * FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = 'freelancer_finance'
        AND TABLE_NAME = 'expenses'
        AND COLUMN_NAME = 'iva_amount'
    ),
    'SELECT "Column iva_amount already exists" AS Info;',
    'ALTER TABLE expenses ADD COLUMN iva_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT "IVA amount to pay (if not included)";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- Step 8: Remove type field from categories table
-- ============================================================================
-- Categories are only for expenses now. An expense is an expense.
-- ============================================================================

-- Remove type column from categories if it exists
SET @sql = (SELECT IF(
    EXISTS(
        SELECT * FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = 'freelancer_finance'
        AND TABLE_NAME = 'categories'
        AND COLUMN_NAME = 'type'
    ),
    'ALTER TABLE categories DROP COLUMN type;',
    'SELECT "Column type already removed" AS Info;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure "Senza Categoria" exists for uncategorized expenses
INSERT IGNORE INTO categories (name, color)
VALUES ('Senza Categoria', '#95a5a6');

-- ============================================================================
-- Migration Complete
-- ============================================================================

SELECT 'Database migration completed successfully!' AS Status;

-- Show current table structures for verification
SHOW TABLES;

-- ============================================================================
