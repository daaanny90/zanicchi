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
  categories: [],
  dashboardYear: null  // null means current year
};

const ThemeState = {
  current: 'light'
};

const THEME_STORAGE_KEY = 'ff_theme';
const VIEW_STORAGE_KEY = 'ff_current_view';

/**
 * Event System for Reactivity
 * 
 * Centralized event names for data changes.
 * Components listen to these events to update automatically.
 */
const AppEvents = {
  // Data change events
  INVOICES_CHANGED: 'data:invoices:changed',
  EXPENSES_CHANGED: 'data:expenses:changed',
  CATEGORIES_CHANGED: 'data:categories:changed',
  WORKED_HOURS_CHANGED: 'data:worked-hours:changed',
  CLIENTS_CHANGED: 'data:clients:changed',
  SETTINGS_CHANGED: 'data:settings:changed',
  
  // Dashboard specific
  DASHBOARD_REFRESH: 'dashboard:refresh',
  DASHBOARD_YEAR_CHANGED: 'dashboardYearChanged'
};

/**
 * Emit a data change event
 * 
 * Notifies all listening components that data has changed.
 * 
 * @param {string} eventName - Event name from AppEvents
 * @param {Object} detail - Optional event detail data
 */
function emitDataChange(eventName, detail = {}) {
  console.log(`[Event] Emitting: ${eventName}`, detail);
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
  
  // Also emit a general dashboard refresh for dashboard-specific components
  if (eventName !== AppEvents.DASHBOARD_REFRESH) {
    window.dispatchEvent(new CustomEvent(AppEvents.DASHBOARD_REFRESH));
  }
}

// Make event system globally available
window.AppEvents = AppEvents;
window.emitDataChange = emitDataChange;

/**
 * Initialize Application
 * 
 * Called when DOM is fully loaded.
 * Sets up navigation and loads initial data.
 */
async function initApp() {
  console.log('Initializing Freelancer Finance Manager...');
  
  initializeTheme();
  setupNavigation();
  setupDashboardYearSelector();
  await loadAppData();
  
  // Restore last viewed page or default to dashboard
  const lastView = localStorage.getItem(VIEW_STORAGE_KEY) || 'dashboard';
  showView(lastView);
  
  console.log('Application initialized successfully');
  console.log('Reactivity system active - all changes will update automatically');
}

function initializeTheme() {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
  applyTheme(initialTheme);

  window.AppTheme = {
    toggle: toggleTheme,
    set: applyTheme,
    get: () => ThemeState.current
  };

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        applyTheme(event.matches ? 'dark' : 'light');
      }
    });
  }
}

function applyTheme(theme) {
  ThemeState.current = theme === 'dark' ? 'dark' : 'light';
  document.body.classList.toggle('dark-theme', ThemeState.current === 'dark');
  localStorage.setItem(THEME_STORAGE_KEY, ThemeState.current);
  window.dispatchEvent(new CustomEvent('theme:changed', { detail: { theme: ThemeState.current } }));
}

function toggleTheme() {
  const next = ThemeState.current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
}

/**
 * Setup Dashboard Year Selector
 * 
 * Initializes the year selector dropdown in the dashboard view.
 * Populates it with years and handles year changes.
 */
function setupDashboardYearSelector() {
  const yearSelect = document.getElementById('dashboard-year-select');
  if (!yearSelect) return;
  
  // Get current year
  const currentYear = new Date().getFullYear();
  
  // Populate with years (current year and 5 years back, plus 1 year forward)
  const years = [];
  for (let i = 1; i >= -5; i--) {
    years.push(currentYear - i);
  }
  
  // Add options
  yearSelect.innerHTML = years.map(year => 
    `<option value="${year}" ${year === currentYear ? 'selected' : ''}>${year}</option>`
  ).join('');
  
  // Set initial year (current year)
  AppState.dashboardYear = currentYear;
  
  // Handle year changes
  yearSelect.addEventListener('change', (e) => {
    const selectedYear = parseInt(e.target.value);
    AppState.dashboardYear = selectedYear;
    
    // Dispatch event to notify all dashboard components
    window.dispatchEvent(new CustomEvent('dashboardYearChanged', {
      detail: { year: selectedYear }
    }));
  });
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
  const manageCategoriesBtn = document.getElementById('manage-categories-btn');
  
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

  if (manageCategoriesBtn) {
    manageCategoriesBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('categories:open-manager'));
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
    case 'toggle-theme':
      if (window.AppTheme?.toggle) {
        window.AppTheme.toggle();
      }
      break;
  }
}

/**
 * Show View
 * 
 * Switches between different views (dashboard, invoices, expenses, settings).
 * Updates navigation state and shows appropriate content.
 * Persists view selection to localStorage.
 * 
 * @param {string} viewName - Name of view to show
 */
function showView(viewName) {
  // Update state
  AppState.currentView = viewName;
  
  // Persist view selection
  localStorage.setItem(VIEW_STORAGE_KEY, viewName);
  
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
 * Reloads categories from API and emits change event.
 * Useful after creating/updating categories.
 */
async function reloadCategories() {
  try {
    AppState.categories = await API.categories.getAll();
    emitDataChange(AppEvents.CATEGORIES_CHANGED);
    // Keep legacy event for backward compatibility
    window.dispatchEvent(new CustomEvent('categories:updated'));
  } catch (error) {
    console.error('Failed to reload categories:', error);
  }
}

window.reloadCategories = reloadCategories;

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

