-- ============================================================================
-- Freelancer Finance Manager - Database Migration Script
-- ============================================================================
-- This script safely updates the database schema to the latest version.
-- It's designed to be idempotent - can be run multiple times safely.
-- All operations check for existence before making changes.
-- ============================================================================

USE freelancer_finance;

-- ============================================================================
-- Migration: Add description field to worked_hours (if not exists)
-- ============================================================================
-- Check and add 'note' column if it doesn't exist
-- This supports the worked hours description feature
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
  'SELECT 1;',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TEXT NULL AFTER amount_cached;')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- Migration: Update settings table with any new settings
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
-- Migration: Ensure all default categories exist
-- ============================================================================
-- Insert default categories if they don't exist
-- ============================================================================

INSERT IGNORE INTO categories (name, type, color)
VALUES
    ('Software e Abbonamenti', 'expense', '#3498db'),
    ('Attrezzature e Hardware', 'expense', '#e74c3c'),
    ('Forniture Ufficio', 'expense', '#2ecc71'),
    ('Viaggi e Trasporti', 'expense', '#f39c12'),
    ('Marketing e Pubblicità', 'expense', '#9b59b6'),
    ('Servizi Professionali', 'expense', '#1abc9c'),
    ('Formazione e Istruzione', 'expense', '#34495e'),
    ('Assicurazioni', 'expense', '#e67e22'),
    ('Utenze e Internet', 'expense', '#95a5a6'),
    ('Varie', 'expense', '#7f8c8d');

-- ============================================================================
-- Migration: Verify table structures and indexes
-- ============================================================================
-- These operations use CREATE IF NOT EXISTS or are no-ops if already present
-- ============================================================================

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
    CONSTRAINT fk_worked_hours_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_worked_date (worked_date),
    INDEX idx_worked_client_date (client_id, worked_date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- ============================================================================
-- Migration Complete
-- ============================================================================

SELECT 'Database migration completed successfully!' AS Status;

-- Show current table structures for verification
SHOW TABLES;

-- ============================================================================
