/**
 * Chart Helper
 * 
 * Utility functions for creating and configuring Chart.js charts.
 * Provides consistent styling and behavior across all charts.
 * 
 * Uses Chart.js library for rendering.
 */

/**
 * Default chart colors
 * 
 * Predefined color palette for consistent chart styling.
 */
const CHART_COLORS = {
  primary: '#2563eb',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#9b59b6',
  teal: '#1abc9c',
  orange: '#e67e22',
  pink: '#e91e63',
  gray: '#95a5a6'
};

/**
 * Default chart options
 * 
 * Base configuration that applies to all charts.
 * Individual charts can override these settings.
 */
const DEFAULT_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        padding: 16,
        font: {
          size: 12,
          family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      padding: 12,
      titleFont: {
        size: 14,
        weight: '600'
      },
      bodyFont: {
        size: 13
      },
      borderColor: '#e5e7eb',
      borderWidth: 1,
      displayColors: true,
      cornerRadius: 8
    }
  }
};

/**
 * Create Line Chart
 * 
 * Creates a line chart for time-series data.
 * Commonly used for income vs expenses over time.
 * 
 * @param {HTMLCanvasElement} canvas - Canvas element to render chart
 * @param {Object} data - Chart data
 * @param {Object} options - Additional options
 * @returns {Chart} Chart instance
 */
function createLineChart(canvas, data, options = {}) {
  const ctx = canvas.getContext('2d');
  
  const config = {
    type: 'line',
    data: data,
    options: {
      ...DEFAULT_CHART_OPTIONS,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          },
          grid: {
            color: '#f3f4f6'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      },
      ...options
    }
  };
  
  return new Chart(ctx, config);
}

/**
 * Create Bar Chart
 * 
 * Creates a bar chart for comparing values.
 * 
 * @param {HTMLCanvasElement} canvas - Canvas element to render chart
 * @param {Object} data - Chart data
 * @param {Object} options - Additional options
 * @returns {Chart} Chart instance
 */
function createBarChart(canvas, data, options = {}) {
  const ctx = canvas.getContext('2d');
  
  const config = {
    type: 'bar',
    data: data,
    options: {
      ...DEFAULT_CHART_OPTIONS,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          },
          grid: {
            color: '#f3f4f6'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      },
      ...options
    }
  };
  
  return new Chart(ctx, config);
}

/**
 * Create Pie Chart
 * 
 * Creates a pie chart for showing proportions.
 * Commonly used for expense breakdown by category.
 * 
 * @param {HTMLCanvasElement} canvas - Canvas element to render chart
 * @param {Object} data - Chart data
 * @param {Object} options - Additional options
 * @returns {Chart} Chart instance
 */
function createPieChart(canvas, data, options = {}) {
  const ctx = canvas.getContext('2d');
  
  const config = {
    type: 'pie',
    data: data,
    options: {
      ...DEFAULT_CHART_OPTIONS,
      plugins: {
        ...DEFAULT_CHART_OPTIONS.plugins,
        legend: {
          ...DEFAULT_CHART_OPTIONS.plugins.legend,
          position: 'right'
        },
        tooltip: {
          ...DEFAULT_CHART_OPTIONS.plugins.tooltip,
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const percentage = context.dataset.percentages[context.dataIndex];
              return `${label}: ${formatCurrency(value)} (${percentage}%)`;
            }
          }
        }
      },
      ...options
    }
  };
  
  return new Chart(ctx, config);
}

/**
 * Create Doughnut Chart
 * 
 * Creates a doughnut chart (pie chart with hole in center).
 * 
 * @param {HTMLCanvasElement} canvas - Canvas element to render chart
 * @param {Object} data - Chart data
 * @param {Object} options - Additional options
 * @returns {Chart} Chart instance
 */
function createDoughnutChart(canvas, data, options = {}) {
  const ctx = canvas.getContext('2d');
  
  const config = {
    type: 'doughnut',
    data: data,
    options: {
      ...DEFAULT_CHART_OPTIONS,
      plugins: {
        ...DEFAULT_CHART_OPTIONS.plugins,
        legend: {
          ...DEFAULT_CHART_OPTIONS.plugins.legend,
          position: 'right'
        },
        tooltip: {
          ...DEFAULT_CHART_OPTIONS.plugins.tooltip,
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const percentage = context.dataset.percentages[context.dataIndex];
              return `${label}: ${formatCurrency(value)} (${percentage}%)`;
            }
          }
        }
      },
      ...options
    }
  };
  
  return new Chart(ctx, config);
}

/**
 * Format month label
 * 
 * Converts YYYY-MM format to readable month label.
 * 
 * @param {string} monthString - Month in YYYY-MM format
 * @returns {string} Formatted month label
 */
function formatMonthLabel(monthString) {
  const [year, month] = monthString.split('-');
  const date = new Date(year, parseInt(month) - 1);
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Destroy chart if it exists
 * 
 * Properly destroys a Chart.js instance before creating a new one.
 * This prevents memory leaks and canvas rendering issues.
 * 
 * @param {Chart} chart - Chart instance to destroy
 */
function destroyChart(chart) {
  if (chart) {
    chart.destroy();
  }
}

