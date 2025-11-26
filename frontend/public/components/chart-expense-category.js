/**
 * Expense by Category Chart Component
 * 
 * Custom Web Component that displays a doughnut chart showing
 * expense breakdown by category.
 * 
 * Uses Chart.js for rendering.
 * 
 * Usage:
 * <chart-expense-category></chart-expense-category>
 */

class ChartExpenseCategory extends HTMLElement {
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
  }
  
  /**
   * Disconnected Callback
   */
  disconnectedCallback() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
  
  /**
   * Load Chart Data
   */
  async loadChart() {
    try {
      this.data = await API.dashboard.getExpenseByCategory();
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
    if (!this.data || !this.data.by_category || this.data.by_category.length === 0) {
      this.showEmpty();
      return;
    }
    
    const canvas = this.shadowRoot.querySelector('#expense-category-chart');
    if (!canvas) return;
    
    // Destroy existing chart
    if (this.chart) {
      this.chart.destroy();
    }
    
    // Prepare chart data
    const labels = this.data.by_category.map(item => item.category_name);
    const amounts = this.data.by_category.map(item => item.total_amount);
    const colors = this.data.by_category.map(item => item.category_color);
    const percentages = this.data.by_category.map(item => item.percentage.toFixed(1));
    
    const chartData = {
      labels: labels,
      datasets: [
        {
          data: amounts,
          backgroundColor: colors,
          borderColor: '#ffffff',
          borderWidth: 2,
          percentages: percentages
        }
      ]
    };
    
    // Create chart
    this.chart = createDoughnutChart(canvas, chartData);
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
          display: flex;
          align-items: center;
          justify-content: center;
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
          <h3 class="chart-title">Spese per Categoria</h3>
          <p class="chart-subtitle">Ripartizione per categoria</p>
        </div>
        
        <div class="chart-container">
          <canvas id="expense-category-chart"></canvas>
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
      container.innerHTML = '<div class="empty">Nessuna spesa registrata</div>';
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
customElements.define('chart-expense-category', ChartExpenseCategory);

