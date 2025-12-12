/**
 * API Client
 * 
 * Centralized API communication module.
 * Provides functions to interact with the backend REST API.
 * 
 * Features:
 * - Consistent error handling
 * - Automatic JSON parsing
 * - Base URL configuration
 * - Request/response logging (in development)
 */

/**
 * API Configuration
 * 
 * Base URL for API requests.
 * In production on Docker, this should point to the backend service.
 * For development, you might need to change this to match your setup.
 */
const API_BASE_URL = window.location.origin.replace(':5500', ':3001').replace(':8082', ':3001') + '/api';

/**
 * Make HTTP request to API
 * 
 * Generic function to make HTTP requests with consistent error handling.
 * 
 * @param {string} endpoint - API endpoint (e.g., '/invoices')
 * @param {Object} options - Fetch options (method, body, etc.)
 * @returns {Promise<Object>} Response data
 * @throws {Error} If request fails
 */
async function apiRequest(endpoint, options = {}) {
  // Build full URL
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Default options
  const config = {
    ...options,
    headers
  };
  
  try {
    console.log(`API Request: ${options.method || 'GET'} ${endpoint}`);
    
    // Make request
    const response = await fetch(url, config);
    
    // Parse JSON response
    const data = await response.json();
    
    // Check if request was successful
    if (!data.success) {
      throw new Error(data.error || 'Request failed');
    }
    
    console.log(`API Response: ${endpoint}`, data);
    return data.data;
    
  } catch (error) {
    console.error(`API Error: ${endpoint}`, error);
    throw error;
  }
}

/**
 * API Object
 * 
 * Organized API methods by resource type.
 * All methods return promises that resolve to the response data.
 */
const API = {
  /**
   * Invoice API Methods
   */
  invoices: {
    // Get all invoices
    getAll: (status = null) => {
      const query = status ? `?status=${status}` : '';
      return apiRequest(`/invoices${query}`);
    },
    
    // Get single invoice by ID
    getById: (id) => {
      return apiRequest(`/invoices/${id}`);
    },
    
    // Create new invoice
    create: (data) => {
      return apiRequest('/invoices', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    
    // Update invoice
    update: (id, data) => {
      return apiRequest(`/invoices/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    
    // Update invoice status
    updateStatus: (id, status) => {
      return apiRequest(`/invoices/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },
    
    // Delete invoice
    delete: (id) => {
      return apiRequest(`/invoices/${id}`, {
        method: 'DELETE'
      });
    }
  },
  
  /**
   * Expense API Methods
   */
  expenses: {
    // Get all expenses
    getAll: (categoryId = null) => {
      const query = categoryId ? `?category_id=${categoryId}` : '';
      return apiRequest(`/expenses${query}`);
    },
    
    // Get single expense by ID
    getById: (id) => {
      return apiRequest(`/expenses/${id}`);
    },
    
    // Create new expense
    create: (data) => {
      return apiRequest('/expenses', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    
    // Update expense
    update: (id, data) => {
      return apiRequest(`/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    
    // Delete expense
    delete: (id) => {
      return apiRequest(`/expenses/${id}`, {
        method: 'DELETE'
      });
    }
  },
  
  /**
   * Category API Methods
   */
  categories: {
    // Get all categories
    getAll: (type = null) => {
      const query = type ? `?type=${type}` : '';
      return apiRequest(`/categories${query}`);
    },
    
    // Get single category by ID
    getById: (id) => {
      return apiRequest(`/categories/${id}`);
    },
    
    // Create new category
    create: (data) => {
      return apiRequest('/categories', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    
    // Update category
    update: (id, data) => {
      return apiRequest(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    
    // Delete category
    delete: (id) => {
      return apiRequest(`/categories/${id}`, {
        method: 'DELETE'
      });
    }
  },
  
  /**
   * Dashboard API Methods
   */
  dashboard: {
    // Get overall summary
    getSummary: () => {
      return apiRequest('/dashboard/summary');
    },
    
    // Get monthly estimate
    getMonthlyEstimate: () => {
      return apiRequest('/dashboard/monthly-estimate');
    },
    
    // Get income vs expense chart data
    getIncomeExpenseChart: (months = 6) => {
      return apiRequest(`/dashboard/income-expense-chart?months=${months}`);
    },
    
    // Get expense by category data
    getExpenseByCategory: () => {
      return apiRequest('/dashboard/expense-by-category');
    },
    
    // Get annual revenue limit status
    getAnnualLimit: () => {
      return apiRequest('/dashboard/annual-limit');
    },
    
    // Get monthly overview with salary calculations
    getMonthlyOverview: (year, month, targetSalary, taxablePercentage, incomeTaxRate, healthInsuranceRate) => {
      const params = new URLSearchParams({
        year: year,
        month: month,
        targetSalary: targetSalary,
        taxablePercentage: taxablePercentage,
        incomeTaxRate: incomeTaxRate,
        healthInsuranceRate: healthInsuranceRate
      });
      return apiRequest(`/dashboard/monthly-overview?${params}`);
    }
  },
  
  /**
   * Settings API Methods
   */
  settings: {
    // Get all settings
    getAll: () => {
      return apiRequest('/settings');
    },
    
    // Update settings
    update: (data) => {
      return apiRequest('/settings', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    }
  },

  /**
   * Client API Methods
   */
  clients: {
    getAll: () => apiRequest('/clients'),
    create: (data) =>
      apiRequest('/clients', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id, data) =>
      apiRequest(`/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id) =>
      apiRequest(`/clients/${id}`, {
        method: 'DELETE'
      })
  },

  /**
   * Worked Hours API Methods
   */
  workedHours: {
    getAll: (params = {}) => {
      const query = new URLSearchParams();
      if (params.month) query.set('month', params.month);
      if (params.clientId) query.set('clientId', params.clientId);
      const suffix = query.toString() ? `?${query.toString()}` : '';
      return apiRequest(`/worked-hours${suffix}`);
    },
    create: (data) =>
      apiRequest('/worked-hours', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id, data) =>
      apiRequest(`/worked-hours/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id) =>
      apiRequest(`/worked-hours/${id}`, {
        method: 'DELETE'
      }),
    getMonthlySummary: (year, month) =>
      apiRequest(`/worked-hours/summary/monthly?year=${year}&month=${month}`),
    getMonthlyReportDetails: (year, month, clientId) => {
      const params = new URLSearchParams({
        year: `${year}`,
        month: `${month}`,
        clientId: `${clientId}`
      });
      return apiRequest(`/worked-hours/reports/monthly?${params.toString()}`);
    },
    downloadMonthlyReportPdf: async (year, month, clientId) => {
      const params = new URLSearchParams({
        year: `${year}`,
        month: `${month}`,
        clientId: `${clientId}`
      });
      const response = await fetch(`${API_BASE_URL}/worked-hours/reports/monthly/pdf?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Impossibile scaricare il PDF');
      }
      const blob = await response.blob();
      return blob;
    }
  }
};

