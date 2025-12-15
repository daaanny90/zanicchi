/**
 * Income vs Expense Chart Component
 * 
 * Custom Web Component that displays a line chart comparing
 * income and expenses over time (last 6 months).
 * 
 * Uses Chart.js for rendering.
 * 
 * Usage:
 * <chart-income-expense></chart-income-expense>
 */

class ChartIncomeExpense extends HTMLElement {
  /**
   * Constructor
   */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.chart = null;
    this.data = null;
  }
  
  /**
   * Connected Callback
   */
  connectedCallback() {
    this.render();
    this.loadChart();
    
    // Listen for year changes
    window.addEventListener('dashboardYearChanged', () => this.loadChart());
  }
  
  /**
   * Disconnected Callback
   * Clean up chart instance when component is removed
   */
  disconnectedCallback() {
    if (this.chart) {
      this.chart.destroy();
    }
    window.removeEventListener('dashboardYearChanged', () => this.loadChart());
  }
  
  /**
   * Load Chart Data
   */
  async loadChart() {
    try {
      const year = window.AppState?.dashboardYear;
      const months = year ? 12 : 6;
      this.data = await API.dashboard.getIncomeExpenseChart(months, year);
      this.renderChart();
    } catch (error) {
      console.error('Failed to load chart data:', error);
      this.showError();
    }
  }
  
  /**
   * Render Chart
   */
  renderChart() {
    if (!this.data || this.data.length === 0) {
      this.showEmpty();
      return;
    }
    
    const canvas = this.shadowRoot.querySelector('#income-expense-chart');
    if (!canvas) return;
    
    // Destroy existing chart
    if (this.chart) {
      this.chart.destroy();
    }
    
    // Prepare chart data
    const labels = this.data.map(item => formatMonthLabel(item.month));
    const incomeData = this.data.map(item => item.income);
    const expensesData = this.data.map(item => item.expenses);
    const netData = this.data.map(item => item.net);
    
    const chartData = {
      labels: labels,
      datasets: [
        {
          label: 'Entrate',
          data: incomeData,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        },
        {
          label: 'Spese',
          data: expensesData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        },
        {
          label: 'Netto',
          data: netData,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        }
      ]
    };
    
    // Create chart
    this.chart = createLineChart(canvas, chartData);
  }
  
  /**
   * Render Component
   */
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-bottom: var(--space-xl);
        }
        
        .chart-card {
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          padding: 1.5rem;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        }
        
        .chart-header {
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .chart-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }
        
        .chart-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0.25rem 0 0 0;
        }
        
        .chart-container {
          position: relative;
          height: 300px;
        }
        
        .loading, .error, .empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 300px;
          color: #6b7280;
          text-align: center;
        }
        
        .error {
          color: #ef4444;
        }
      </style>
      
      <div class="chart-card">
        <div class="chart-header">
          <h3 class="chart-title">Entrate vs Spese</h3>
          <p class="chart-subtitle">Confronto ultimi 6 mesi</p>
        </div>
        
        <div class="chart-container">
          <canvas id="income-expense-chart"></canvas>
        </div>
      </div>
    `;
  }
  
  /**
   * Show Empty State
   */
  showEmpty() {
    const container = this.shadowRoot.querySelector('.chart-container');
    if (container) {
      container.innerHTML = '<div class="empty">Nessun dato ancora disponibile</div>';
    }
  }
  
  /**
   * Show Error State
   */
  showError() {
    const container = this.shadowRoot.querySelector('.chart-container');
    if (container) {
      container.innerHTML = '<div class="error">Impossibile caricare i dati del grafico</div>';
    }
  }
}

// Register the custom element
customElements.define('chart-income-expense', ChartIncomeExpense);

