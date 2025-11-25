/**
 * Calculation Utilities
 * 
 * This module provides financial calculation functions used throughout
 * the application. All monetary calculations are done with proper
 * precision to avoid floating-point errors.
 * 
 * Key functions:
 * - Tax calculations for invoices
 * - Net income calculations
 * - Percentage calculations for charts
 */

/**
 * Calculate tax amount from base amount and tax rate
 * 
 * Calculates tax using the formula: amount * (taxRate / 100)
 * Result is rounded to 2 decimal places for currency precision.
 * 
 * @param amount - Base amount before tax
 * @param taxRate - Tax rate percentage (e.g., 22 for 22%)
 * @returns Calculated tax amount
 */
export function calculateTax(amount: number, taxRate: number): number {
  const tax = amount * (taxRate / 100);
  // Round to 2 decimal places for currency
  return Math.round(tax * 100) / 100;
}

/**
 * Calculate total amount including tax
 * 
 * @param amount - Base amount before tax
 * @param taxAmount - Tax amount
 * @returns Total amount (amount + tax)
 */
export function calculateTotal(amount: number, taxAmount: number): number {
  const total = amount + taxAmount;
  // Round to 2 decimal places
  return Math.round(total * 100) / 100;
}

/**
 * Calculate net income from gross income and expenses
 * 
 * Net income = Total Income - Total Expenses - Tax on Income
 * This is the actual profit after all costs and taxes.
 * 
 * @param totalIncome - Total income amount
 * @param totalExpenses - Total expenses amount
 * @param taxAmount - Total tax amount on income
 * @returns Net income amount
 */
export function calculateNetIncome(
  totalIncome: number,
  totalExpenses: number,
  taxAmount: number
): number {
  const net = totalIncome - totalExpenses - taxAmount;
  return Math.round(net * 100) / 100;
}

/**
 * Calculate percentage
 * 
 * Calculates what percentage 'part' is of 'total'.
 * Used for expense category breakdowns and other metrics.
 * 
 * @param part - Part value
 * @param total - Total value
 * @returns Percentage (0-100), rounded to 2 decimal places
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  
  const percentage = (part / total) * 100;
  return Math.round(percentage * 100) / 100;
}

/**
 * Round currency amount
 * 
 * Ensures all currency amounts are rounded to 2 decimal places.
 * This prevents floating-point precision issues.
 * 
 * @param amount - Amount to round
 * @returns Rounded amount
 */
export function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Sum an array of numbers
 * 
 * Helper function to safely sum monetary values.
 * 
 * @param numbers - Array of numbers to sum
 * @returns Sum of all numbers
 */
export function sumNumbers(numbers: number[]): number {
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return roundCurrency(sum);
}

// ============================================================================
// Italian "Regime Forfettario" Tax Calculations
// ============================================================================
// The Italian flat-rate tax regime (regime forfettario) has specific rules:
// 1. Only a percentage of income is taxable (coefficiente di redditività)
// 2. A flat tax rate is applied to the taxable income
// 3. Health insurance (INPS) is calculated on the taxable income
// ============================================================================

/**
 * Calculate taxable income for Italian "regime forfettario"
 * 
 * In the flat-rate regime, only a percentage of the gross income is
 * considered taxable (coefficiente di redditività).
 * For most professions, this is 76%.
 * 
 * @param grossIncome - Total gross income
 * @param taxablePercentage - Percentage of income that is taxable (e.g., 76)
 * @returns Taxable income amount
 */
export function calculateTaxableIncome(
  grossIncome: number,
  taxablePercentage: number
): number {
  const taxable = grossIncome * (taxablePercentage / 100);
  return roundCurrency(taxable);
}

/**
 * Calculate income tax for Italian "regime forfettario"
 * 
 * The flat tax rate (usually 15%, or 5% for the first 5 years) is applied
 * to the taxable income, not the gross income.
 * 
 * @param taxableIncome - The taxable income (after applying coefficiente)
 * @param incomeTaxRate - Income tax rate percentage (e.g., 15)
 * @returns Income tax amount
 */
export function calculateIncomeTax(
  taxableIncome: number,
  incomeTaxRate: number
): number {
  const tax = taxableIncome * (incomeTaxRate / 100);
  return roundCurrency(tax);
}

/**
 * Calculate health insurance (INPS) for Italian freelancers
 * 
 * Health insurance contribution is calculated as a percentage of the
 * taxable income. The rate varies by profession but is typically around 27%.
 * 
 * @param taxableIncome - The taxable income (after applying coefficiente)
 * @param healthInsuranceRate - INPS rate percentage (e.g., 27)
 * @returns Health insurance contribution amount
 */
export function calculateHealthInsurance(
  taxableIncome: number,
  healthInsuranceRate: number
): number {
  const insurance = taxableIncome * (healthInsuranceRate / 100);
  return roundCurrency(insurance);
}

/**
 * Calculate total tax burden for Italian "regime forfettario"
 * 
 * This includes both income tax and health insurance contributions.
 * 
 * @param grossIncome - Total gross income
 * @param taxablePercentage - Percentage of income that is taxable (e.g., 76)
 * @param incomeTaxRate - Income tax rate percentage (e.g., 15)
 * @param healthInsuranceRate - INPS rate percentage (e.g., 27)
 * @returns Object with breakdown of all tax components
 */
export function calculateItalianTaxes(
  grossIncome: number,
  taxablePercentage: number,
  incomeTaxRate: number,
  healthInsuranceRate: number
): {
  taxableIncome: number;
  incomeTax: number;
  healthInsurance: number;
  totalTaxBurden: number;
} {
  const taxableIncome = calculateTaxableIncome(grossIncome, taxablePercentage);
  const incomeTax = calculateIncomeTax(taxableIncome, incomeTaxRate);
  const healthInsurance = calculateHealthInsurance(taxableIncome, healthInsuranceRate);
  const totalTaxBurden = roundCurrency(incomeTax + healthInsurance);

  return {
    taxableIncome,
    incomeTax,
    healthInsurance,
    totalTaxBurden
  };
}

