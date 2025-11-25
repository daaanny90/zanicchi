/**
 * Monthly Estimate Component
 * 
 * Custom Web Component that displays current month's financial estimate.
 * Shows income, expenses, and net income for the current month.
 * 
 * Usage:
 * <monthly-estimate></monthly-estimate>
 */

class MonthlyEstimate extends HTMLElement {
  /**
   * Constructor
   */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.data = null;
  }
  
  /**
   * Connected Callback
   */
  connectedCallback() {
    this.render();
    this.loadEstimate();
  }
  
  /**
   * Load Estimate Data
   * Fetches monthly estimate from API
   */
  async loadEstimate() {
    try {
      this.data = await API.dashboard.getMonthlyEstimate();
      this.render();
    } catch (error) {
      console.error('Failed to load monthly estimate:', error);
      this.showError();
    }
  }
  
  /**
   * Render Component
   */
  render() {
    const settings = getSettings();
    const currency = settings?.currency || 'EUR';
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-bottom: 2rem;
        }
        
        .estimate-card {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          border-radius: 0.75rem;
          padding: 2rem;
          color: white;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        }
        
        .estimate-header {
          margin-bottom: 1.5rem;
        }
        
        .estimate-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 0.25rem 0;
          opacity: 0.95;
        }
        
        .estimate-subtitle {
          font-size: 0.875rem;
          margin: 0;
          opacity: 0.8;
        }
        
        .estimate-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1.5rem;
        }
        
        .estimate-item {
          /* Styling for each metric */
        }
        
        .estimate-label {
          font-size: 0.875rem;
          opacity: 0.9;
          margin-bottom: 0.5rem;
        }
        
        .estimate-value {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }
        
        .estimate-count {
          font-size: 0.75rem;
          opacity: 0.8;
          margin-top: 0.25rem;
        }
        
        .loading, .error {
          text-align: center;
          padding: 2rem;
        }
        
        @media (max-width: 768px) {
          .estimate-card {
            padding: 1.5rem;
          }
          
          .estimate-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .estimate-value {
            font-size: 1.25rem;
          }
        }
      </style>
      
      <div class="estimate-card">
        ${this.data ? this.renderEstimate(currency) : '<div class="loading">Loading estimate...</div>'}
      </div>
    `;
  }
  
  /**
   * Render Estimate Data
   */
  renderEstimate(currency) {
    const monthName = new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    return `
      <div class="estimate-header">
        <h2 class="estimate-title">This Month's Estimate</h2>
        <p class="estimate-subtitle">${monthName}</p>
      </div>
      
      <div class="estimate-grid">
        <div class="estimate-item">
          <div class="estimate-label">Income</div>
          <p class="estimate-value">${formatCurrency(this.data.total_income, currency)}</p>
          <div class="estimate-count">${this.data.invoice_count} invoice(s)</div>
        </div>
        
        <div class="estimate-item">
          <div class="estimate-label">Expenses</div>
          <p class="estimate-value">${formatCurrency(this.data.total_expenses, currency)}</p>
          <div class="estimate-count">${this.data.expense_count} expense(s)</div>
        </div>
        
        <div class="estimate-item">
          <div class="estimate-label">Net Income</div>
          <p class="estimate-value">${formatCurrency(this.data.net_income, currency)}</p>
          <div class="estimate-count">After tax & expenses</div>
        </div>
      </div>
    `;
  }
  
  /**
   * Show Error State
   */
  showError() {
    this.shadowRoot.innerHTML = `
      <style>
        .error { text-align: center; padding: 2rem; color: #ef4444; }
      </style>
      <div class="error">Failed to load monthly estimate.</div>
    `;
  }
}

// Register the custom element
customElements.define('monthly-estimate', MonthlyEstimate);

