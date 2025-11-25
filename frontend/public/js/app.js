/**
 * Application Initialization
 * 
 * Main application entry point.
 * Initializes the application and sets up event listeners.
 * 
 * This file:
 * - Handles view navigation
 * - Manages global app state
 * - Coordinates between components
 */

/**
 * Application State
 * 
 * Global state object that stores application-wide data.
 */
const AppState = {
  currentView: 'dashboard',
  settings: null,
  categories: []
};

/**
 * Initialize Application
 * 
 * Called when DOM is fully loaded.
 * Sets up navigation and loads initial data.
 */
async function initApp() {
  console.log('Initializing Freelancer Finance Manager...');
  
  // Setup navigation
  setupNavigation();
  
  // Load settings and categories
  await loadAppData();
  
  // Show initial view
  showView('dashboard');
  
  console.log('Application initialized successfully');
}

/**
 * Setup Navigation
 * 
 * Attaches click handlers to navigation items.
 * Handles view switching and active state updates.
 */
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    const action = item.getAttribute('data-action');
    if (action) {
      item.addEventListener('click', () => handleNavigationAction(action));
      return;
    }
    
    const viewName = item.getAttribute('data-view');
    if (viewName) {
      item.addEventListener('click', () => showView(viewName));
    }
  });
  
  // Setup "Add" buttons
  const addInvoiceBtn = document.getElementById('add-invoice-btn');
  const addExpenseBtn = document.getElementById('add-expense-btn');
  
  if (addInvoiceBtn) {
    addInvoiceBtn.addEventListener('click', () => {
      const form = document.querySelector('invoice-form');
      if (form) {
        form.show();
      }
    });
  }
  
  if (addExpenseBtn) {
    addExpenseBtn.addEventListener('click', () => {
      const form = document.querySelector('expense-form');
      if (form) {
        form.show();
      }
    });
  }
}

function handleNavigationAction(action) {
  switch (action) {
    case 'log-hours': {
      const defaultDate = typeof getTodayDate === 'function'
        ? getTodayDate()
        : new Date().toISOString().split('T')[0];
      window.dispatchEvent(new CustomEvent('worked-hours:open-modal', {
        detail: { defaultDate }
      }));
      break;
    }
    case 'manage-clients':
      window.dispatchEvent(new CustomEvent('clients:open-manager'));
      break;
  }
}

/**
 * Show View
 * 
 * Switches between different views (dashboard, invoices, expenses, settings).
 * Updates navigation state and shows appropriate content.
 * 
 * @param {string} viewName - Name of view to show
 */
function showView(viewName) {
  // Update state
  AppState.currentView = viewName;
  
  // Hide all views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  
  // Show selected view
  const view = document.getElementById(`${viewName}-view`);
  if (view) {
    view.classList.add('active');
  }
  
  // Update navigation active state
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-view') === viewName) {
      item.classList.add('active');
    }
  });
  
  // Trigger view-specific initialization if needed
  initializeView(viewName);
}

/**
 * Initialize View
 * 
 * Performs view-specific initialization when a view is shown.
 * Triggers data loading for components in the view.
 * 
 * @param {string} viewName - Name of view being shown
 */
function initializeView(viewName) {
  switch (viewName) {
    case 'dashboard':
      // Refresh dashboard components
      refreshDashboard();
      break;
      
    case 'invoices':
      // Refresh invoice list
      const invoiceList = document.querySelector('invoice-list');
      if (invoiceList && invoiceList.loadInvoices) {
        invoiceList.loadInvoices();
      }
      break;
      
    case 'expenses':
      // Refresh expense list
      const expenseList = document.querySelector('expense-list');
      if (expenseList && expenseList.loadExpenses) {
        expenseList.loadExpenses();
      }
      break;
      
    case 'settings':
      // Refresh settings panel
      const settingsPanel = document.querySelector('settings-panel');
      if (settingsPanel && settingsPanel.loadSettings) {
        settingsPanel.loadSettings();
      }
      break;
  }
}

/**
 * Refresh Dashboard
 * 
 * Triggers refresh of all dashboard components.
 */
function refreshDashboard() {
  // Refresh summary
  const summary = document.querySelector('dashboard-summary');
  if (summary && summary.loadSummary) {
    summary.loadSummary();
  }
  
  // Refresh monthly estimate
  const estimate = document.querySelector('monthly-estimate');
  if (estimate && estimate.loadEstimate) {
    estimate.loadEstimate();
  }
  
  // Refresh charts
  const incomeExpenseChart = document.querySelector('chart-income-expense');
  if (incomeExpenseChart && incomeExpenseChart.loadChart) {
    incomeExpenseChart.loadChart();
  }
  
  const categoryChart = document.querySelector('chart-expense-category');
  if (categoryChart && categoryChart.loadChart) {
    categoryChart.loadChart();
  }
}

/**
 * Load App Data
 * 
 * Loads global application data on startup.
 * This includes settings and categories that are used throughout the app.
 */
async function loadAppData() {
  try {
    // Load settings
    AppState.settings = await API.settings.getAll();
    
    // Load categories
    AppState.categories = await API.categories.getAll();
    
    console.log('App data loaded:', AppState);
  } catch (error) {
    console.error('Failed to load app data:', error);
    showNotification('Failed to load application data', 'error');
  }
}

/**
 * Get Settings
 * 
 * Returns current application settings.
 * @returns {Object} Settings object
 */
function getSettings() {
  return AppState.settings;
}

/**
 * Get Categories
 * 
 * Returns list of all categories.
 * @returns {Array} Categories array
 */
function getCategories() {
  return AppState.categories;
}

/**
 * Reload Categories
 * 
 * Reloads categories from API.
 * Useful after creating/updating categories.
 */
async function reloadCategories() {
  try {
    AppState.categories = await API.categories.getAll();
  } catch (error) {
    console.error('Failed to reload categories:', error);
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

