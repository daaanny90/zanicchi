/**
 * Dashboard Summary Component
 * 
 * Custom Web Component that displays high-level financial metrics.
 * Shows cards with total income, expenses, net income, and pending amounts.
 * 
 * Usage:
 * <dashboard-summary></dashboard-summary>
 */

class DashboardSummary extends HTMLElement {
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
   * Loads summary data when component is added to DOM
   */
  connectedCallback() {
    this.render();
    this.loadSummary();
  }
  
  /**
   * Load Summary Data
   * Fetches dashboard summary from API
   */
  async loadSummary() {
    try {
      this.data = await API.dashboard.getSummary();
      this.render();
    } catch (error) {
      console.error('Failed to load dashboard summary:', error);
      this.showError();
    }
  }
  
  /**
   * Render Component
   */
  render() {
    const settings = window.AppState?.settings;
    const currency = settings?.currency || 'EUR';
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .summary-card {
          background-color: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 0.5rem;
          padding: 1.5rem;
          box-shadow: var(--shadow-sm);
          transition: box-shadow 0.2s;
        }
        
        .summary-card:hover {
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        
        .summary-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }
        
        .summary-title {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .summary-icon {
          font-size: 1.5rem;
        }
        
        .summary-value {
          font-size: 1.875rem;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0;
        }
        
        .summary-value.positive {
          color: var(--color-success);
        }
        
        .summary-value.negative {
          color: var(--color-danger);
        }
        
        .loading {
          text-align: center;
          padding: 2rem;
          color: var(--color-text-secondary);
        }
        
        .error {
          text-align: center;
          padding: 2rem;
          color: var(--color-danger);
        }
        
        @media (max-width: 768px) {
          .summary-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .summary-card {
            padding: 1rem;
          }
          
          .summary-value {
            font-size: 1.5rem;
          }
        }
      </style>
      
      <div class="summary-grid">
        ${this.data ? this.renderSummaryCards(currency) : '<div class="loading">Caricamento riepilogo...</div>'}
      </div>
    `;
  }
  
  /**
   * Render Summary Cards
   * Creates HTML for all summary cards
   */
  renderSummaryCards(currency) {
    return `
      <div class="summary-card">
        <div class="summary-header">
          <span class="summary-title">Entrate Totali</span>
          <span class="summary-icon">💰</span>
        </div>
        <p class="summary-value positive">${formatCurrency(this.data.total_income, currency)}</p>
      </div>
      
      <div class="summary-card">
        <div class="summary-header">
          <span class="summary-title">Spese Totali</span>
          <span class="summary-icon">💸</span>
        </div>
        <p class="summary-value">${formatCurrency(this.data.total_expenses, currency)}</p>
      </div>
      
      <div class="summary-card">
        <div class="summary-header">
          <span class="summary-title">Reddito Netto</span>
          <span class="summary-icon">📊</span>
        </div>
        <p class="summary-value ${this.data.net_income >= 0 ? 'positive' : 'negative'}">
          ${formatCurrency(this.data.net_income, currency)}
        </p>
      </div>
      
      <div class="summary-card">
        <div class="summary-header">
          <span class="summary-title">In Attesa</span>
          <span class="summary-icon">⏳</span>
        </div>
        <p class="summary-value">${formatCurrency(this.data.pending_invoices, currency)}</p>
      </div>
    `;
  }
  
  /**
   * Show Error State
   */
  showError() {
    this.shadowRoot.innerHTML = `
      <style>
        .error {
          text-align: center;
          padding: 2rem;
          color: var(--color-danger);
        }
      </style>
      <div class="error">Impossibile caricare i dati del riepilogo. Riprova.</div>
    `;
  }
}

// Register the custom element
customElements.define('dashboard-summary', DashboardSummary);

