/**
 * Utility Functions
 * 
 * Common utility functions used throughout the frontend application.
 * Includes formatting functions for:
 * - Currency
 * - Dates
 * - Numbers
 * 
 * These utilities ensure consistent formatting across the UI.
 */

/**
 * Format number as currency
 * 
 * Formats a number according to the configured currency.
 * Uses the currency symbol from settings.
 * 
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'EUR')
 * @returns {string} Formatted currency string
 * 
 * @example
 * formatCurrency(1234.56, 'EUR') // "€1,234.56"
 */
function formatCurrency(amount, currency = 'EUR') {
  // Get currency symbol
  const symbols = {
    'EUR': '€',
    'USD': '$',
    'GBP': '£',
    'JPY': '¥'
  };
  
  const symbol = symbols[currency] || currency;
  
  // Format number with thousand separators and 2 decimal places
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
  
  // Return with currency symbol
  // For EUR, symbol goes after the number; for others, before
  if (currency === 'EUR') {
    return `${formatted}${symbol}`;
  } else {
    return `${symbol}${formatted}`;
  }
}

/**
 * Format date to readable string
 * 
 * Converts YYYY-MM-DD format to a more readable format.
 * 
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {string} format - Format type: 'short', 'long', 'medium' (default: 'medium')
 * @returns {string} Formatted date string
 * 
 * @example
 * formatDate('2024-11-25', 'medium') // "Nov 25, 2024"
 * formatDate('2024-11-25', 'long') // "November 25, 2024"
 */
function formatDate(dateString, format = 'medium') {
  if (!dateString) return '';
  
  const date = new Date(dateString + 'T00:00:00'); // Prevent timezone issues
  
  const options = {
    short: { month: 'numeric', day: 'numeric', year: '2-digit' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' }
  };
  
  return date.toLocaleDateString('en-US', options[format] || options.medium);
}

/**
 * Format date for input field
 * 
 * Ensures date is in YYYY-MM-DD format for date inputs.
 * 
 * @param {Date|string} date - Date object or string
 * @returns {string} Date in YYYY-MM-DD format
 */
function formatDateForInput(date) {
  if (!date) {
    date = new Date();
  }
  
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date in YYYY-MM-DD format
 * 
 * @returns {string} Today's date
 */
function getTodayDate() {
  return formatDateForInput(new Date());
}

/**
 * Format number with thousands separator
 * 
 * @param {number} number - Number to format
 * @returns {string} Formatted number
 * 
 * @example
 * formatNumber(1234567) // "1,234,567"
 */
function formatNumber(number) {
  return new Intl.NumberFormat('en-US').format(number);
}

/**
 * Format percentage
 * 
 * @param {number} value - Percentage value (0-100)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage
 * 
 * @example
 * formatPercentage(25.5) // "25.5%"
 */
function formatPercentage(value, decimals = 1) {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Get invoice status badge class
 * 
 * Returns the CSS class for an invoice status badge.
 * 
 * @param {string} status - Invoice status
 * @returns {string} CSS class name
 */
function getStatusBadgeClass(status) {
  const classes = {
    'draft': 'badge-draft',
    'sent': 'badge-sent',
    'paid': 'badge-paid',
    'overdue': 'badge-overdue'
  };
  
  return classes[status] || 'badge-draft';
}

/**
 * Get invoice status label
 * 
 * Returns a human-readable label for an invoice status.
 * 
 * @param {string} status - Invoice status
 * @returns {string} Status label
 */
function getStatusLabel(status) {
  const labels = {
    'draft': 'Draft',
    'sent': 'Sent',
    'paid': 'Paid',
    'overdue': 'Overdue'
  };
  
  return labels[status] || status;
}

/**
 * Debounce function
 * 
 * Delays function execution until after a specified time has elapsed
 * since the last call. Useful for search inputs and resize handlers.
 * 
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Show notification (simple toast)
 * 
 * Displays a temporary notification message.
 * Auto-dismisses after a few seconds.
 * 
 * @param {string} message - Message to display
 * @param {string} type - Notification type: 'success', 'error', 'info', 'warning'
 */
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Add styles
  Object.assign(notification.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '16px 24px',
    borderRadius: '8px',
    backgroundColor: type === 'success' ? '#10b981' : 
                     type === 'error' ? '#ef4444' :
                     type === 'warning' ? '#f59e0b' : '#3b82f6',
    color: 'white',
    fontWeight: '500',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    zIndex: '9999',
    animation: 'slideIn 0.3s ease-out'
  });
  
  // Add to document
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

/**
 * Validate email format
 * 
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Capitalize first letter of string
 * 
 * @param {string} string - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

