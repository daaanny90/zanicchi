/**
 * Monthly Estimate Component
 * 
 * Custom Web Component that displays current month's financial estimate.
 * Shows TWO sections:
 * 1. Invoice-based data (traditional invoices)
 * 2. Hours-based data (from logged worked hours)
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
    this.invoiceData = null;
    this.hoursData = null;
    this.settings = null;
  }
  
  /**
   * Connected Callback
   */
  connectedCallback() {
    this.render();
    this.loadData();
  }
  
  /**
   * Load Both Invoice and Hours Data
   */
  async loadData() {
    try {
      // Load settings first
      this.settings = await API.settings.getAll();
      
      // Load invoice-based estimate (traditional)
      this.invoiceData = await API.dashboard.getMonthlyEstimate();
      
      // Load hours-based estimate for current month
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      this.hoursData = await API.dashboard.getMonthlyOverview(
        currentYear,
        currentMonth,
        parseFloat(this.settings.target_salary || 3000),
        parseFloat(this.settings.taxable_percentage || 67),
        parseFloat(this.settings.income_tax_rate || 15),
        parseFloat(this.settings.health_insurance_rate || 26.07)
      );
      
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
    const settings = window.AppState?.settings || this.settings;
    const currency = settings?.currency || 'EUR';
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-bottom: var(--space-xl);
        }
        
        .estimate-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
        }
        
        .estimate-card {
          border-radius: 0.375rem;
          padding: 2rem;
          color: #fff;
          box-shadow: 0 4px 8px 0 rgb(0 0 0 / 0.08);
          position: relative;
          overflow: hidden;
        }
        
        .estimate-card.invoices {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        }
        
        .estimate-card.hours {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
        
        .estimate-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(255, 255, 255, 0.2);
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .estimate-header {
          margin-bottom: 1.5rem;
        }
        
        .estimate-title {
          font-size: 1.25rem;
          font-weight: 700;
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
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1.5rem;
        }
        
        .estimate-item {
          background: rgba(255, 255, 255, 0.15);
          padding: 1rem;
          border-radius: 0.25rem;
          backdrop-filter: blur(10px);
        }
        
        .estimate-label {
          font-size: 0.75rem;
          font-weight: 600;
          opacity: 0.9;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .estimate-value {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
          line-height: 1;
        }
        
        .estimate-count {
          font-size: 0.75rem;
          opacity: 0.8;
          margin-top: 0.5rem;
        }
        
        .estimate-icon {
          font-size: 1.25rem;
          margin-right: 0.5rem;
        }
        
        .loading, .error {
          text-align: center;
          padding: 2rem;
          color: #fff;
        }
        
        @media (max-width: 968px) {
          .estimate-container {
            grid-template-columns: 1fr;
          }
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
      
      <div class="estimate-container">
        ${(this.invoiceData && this.hoursData) ? this.renderBothEstimates(currency) : '<div class="loading">Caricamento stime...</div>'}
      </div>
    `;
  }
  
  /**
   * Render Both Invoice and Hours Estimates
   */
  renderBothEstimates(currency) {
    const monthName = new Date().toLocaleDateString('it-IT', { 
      month: 'long', 
      year: 'numeric' 
    });
    const monthNameCap = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    
    return `
      <!-- Invoice-Based Section -->
      <div class="estimate-card invoices">
        <div class="estimate-badge">Fatture</div>
        <div class="estimate-header">
          <h2 class="estimate-title">
            <span class="estimate-icon">📄</span>
            Dati da Fatture
          </h2>
          <p class="estimate-subtitle">${monthNameCap}</p>
        </div>
        
        <div class="estimate-grid">
          <div class="estimate-item">
            <div class="estimate-label">Entrate</div>
            <p class="estimate-value">${formatCurrency(this.invoiceData.total_income, currency)}</p>
            <div class="estimate-count">${this.invoiceData.invoice_count} fattura/e</div>
          </div>
          
          <div class="estimate-item">
            <div class="estimate-label">Spese</div>
            <p class="estimate-value">${formatCurrency(this.invoiceData.total_expenses, currency)}</p>
            <div class="estimate-count">${this.invoiceData.expense_count} spesa/e</div>
          </div>
          
          <div class="estimate-item">
            <div class="estimate-label">Reddito Netto</div>
            <p class="estimate-value">${formatCurrency(this.invoiceData.net_income, currency)}</p>
            <div class="estimate-count">Dopo tasse</div>
          </div>
        </div>
      </div>
      
      <!-- Hours-Based Section -->
      <div class="estimate-card hours">
        <div class="estimate-badge">Ore Lavorate</div>
        <div class="estimate-header">
          <h2 class="estimate-title">
            <span class="estimate-icon">⏱️</span>
            Dati da Ore Registrate
          </h2>
          <p class="estimate-subtitle">${monthNameCap}</p>
        </div>
        
        <div class="estimate-grid">
          <div class="estimate-item">
            <div class="estimate-label">Entrate</div>
            <p class="estimate-value">${formatCurrency(this.hoursData.total_income, currency)}</p>
            <div class="estimate-count">${this.hoursData.invoice_count} registrazione/i</div>
          </div>
          
          <div class="estimate-item">
            <div class="estimate-label">Spese</div>
            <p class="estimate-value">${formatCurrency(this.hoursData.total_expenses, currency)}</p>
            <div class="estimate-count">${this.hoursData.expense_count} spesa/e</div>
          </div>
          
          <div class="estimate-item">
            <div class="estimate-label">Reddito Netto</div>
            <p class="estimate-value">${formatCurrency(this.hoursData.net_income, currency)}</p>
            <div class="estimate-count">Dopo tasse e INPS</div>
          </div>
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
      <div class="error">Impossibile caricare la stima mensile.</div>
    `;
  }
}

// Register the custom element
customElements.define('monthly-estimate', MonthlyEstimate);

