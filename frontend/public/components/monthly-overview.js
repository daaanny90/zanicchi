/**
 * Monthly Overview Component
 * 
 * Custom Web Component for displaying comprehensive monthly financial overview
 * with salary-based calculations.
 * 
 * Features:
 * - Month selector (dropdown to view different months)
 * - Income, expenses, and tax breakdown
 * - Target salary tracking
 * - Taxes to set aside calculation
 * - Savings calculation
 * 
 * Usage:
 * <monthly-overview></monthly-overview>
 */

class MonthlyOverview extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.overview = null;
    this.selectedYear = new Date().getFullYear();
    this.selectedMonth = new Date().getMonth() + 1; // 1-12
    this.settings = null;
  }
  
  connectedCallback() {
    this.render();
    this.loadSettings();
  }
  
  /**
   * Load application settings (for target salary and tax rate)
   */
  async loadSettings() {
    try {
      const settings = await API.settings.getAll();
      this.settings = {
        target_salary: parseFloat(settings.target_salary || 3000),
        default_tax_rate: parseFloat(settings.default_tax_rate || 22),
        currency: settings.currency || 'EUR'
      };
      this.loadOverview();
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }
  
  /**
   * Load monthly overview data
   */
  async loadOverview() {
    if (!this.settings) return;
    
    try {
      const params = new URLSearchParams({
        year: this.selectedYear,
        month: this.selectedMonth,
        targetSalary: this.settings.target_salary,
        taxRate: this.settings.default_tax_rate
      });
      
      const response = await fetch(`${API_BASE_URL}/dashboard/monthly-overview?${params}`);
      const result = await response.json();
      
      if (result.success) {
        this.overview = result.data;
        this.render();
      }
    } catch (error) {
      console.error('Failed to load monthly overview:', error);
      this.overview = null;
      this.render();
    }
  }
  
  /**
   * Generate list of available months (current month and past 24 months)
   */
  getAvailableMonths() {
    const months = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // Generate list of past 24 months plus current month
    for (let i = 0; i <= 24; i++) {
      const date = new Date(currentYear, currentMonth - 1 - i, 1);
      months.push({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        label: date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
      });
    }
    
    return months;
  }
  
  /**
   * Format month label for display
   */
  getMonthLabel() {
    const date = new Date(this.selectedYear, this.selectedMonth - 1, 1);
    return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  }
  
  /**
   * Render overview content
   */
  renderOverview() {
    if (!this.overview || !this.settings) {
      return '<div class="loading">Caricamento panoramica mensile...</div>';
    }
    
    const currency = this.settings.currency;
    
    return `
      <div class="overview-grid">
        <!-- Income Section -->
        <div class="overview-card income-card">
          <div class="card-header">
            <span class="card-icon">💰</span>
            <h3 class="card-title">Entrate</h3>
          </div>
          <div class="card-value positive">${formatCurrency(this.overview.total_income, currency)}</div>
          <div class="card-detail">${this.overview.invoice_count} fattura/e pagata/e</div>
        </div>
        
        <!-- Expenses Section -->
        <div class="overview-card expenses-card">
          <div class="card-header">
            <span class="card-icon">💸</span>
            <h3 class="card-title">Spese</h3>
          </div>
          <div class="card-value">${formatCurrency(this.overview.total_expenses, currency)}</div>
          <div class="card-detail">${this.overview.expense_count} spesa/e</div>
        </div>
        
        <!-- Tax Paid Section -->
        <div class="overview-card tax-card">
          <div class="card-header">
            <span class="card-icon">🏛️</span>
            <h3 class="card-title">IVA Pagata</h3>
          </div>
          <div class="card-value">${formatCurrency(this.overview.total_tax, currency)}</div>
          <div class="card-detail">Già inclusa nelle fatture</div>
        </div>
        
        <!-- Net Income Section -->
        <div class="overview-card net-card">
          <div class="card-header">
            <span class="card-icon">📊</span>
            <h3 class="card-title">Reddito Netto</h3>
          </div>
          <div class="card-value ${this.overview.net_income >= 0 ? 'positive' : 'negative'}">
            ${formatCurrency(this.overview.net_income, currency)}
          </div>
          <div class="card-detail">Dopo spese e tasse</div>
        </div>
      </div>
      
      <!-- Salary-based Breakdown -->
      <div class="salary-breakdown">
        <h3 class="breakdown-title">Ripartizione Basata sullo Stipendio</h3>
        <div class="breakdown-grid">
          <!-- Target Salary -->
          <div class="breakdown-item salary-item">
            <div class="breakdown-label">
              <span class="breakdown-icon">💼</span>
              <span>Stipendio Desiderato</span>
            </div>
            <div class="breakdown-value">${formatCurrency(this.overview.target_salary, currency)}</div>
          </div>
          
          <!-- Taxes to Set Aside -->
          <div class="breakdown-item tax-item">
            <div class="breakdown-label">
              <span class="breakdown-icon">📋</span>
              <span>Tasse da Accantonare</span>
            </div>
            <div class="breakdown-value">${formatCurrency(this.overview.taxes_to_set_aside, currency)}</div>
            <div class="breakdown-note">${this.settings.default_tax_rate}% sul reddito netto</div>
          </div>
          
          <!-- Savings -->
          <div class="breakdown-item savings-item">
            <div class="breakdown-label">
              <span class="breakdown-icon">💎</span>
              <span>Risparmi</span>
            </div>
            <div class="breakdown-value ${this.overview.savings >= 0 ? 'positive' : 'negative'}">
              ${formatCurrency(this.overview.savings, currency)}
            </div>
            <div class="breakdown-note">Dopo stipendio e tasse</div>
          </div>
        </div>
        
        <!-- Summary Formula -->
        <div class="formula-box">
          <h4 class="formula-title">Formula di Calcolo:</h4>
          <div class="formula-text">
            Risparmi = Reddito Netto - Stipendio Desiderato - Tasse da Accantonare
          </div>
          <div class="formula-calculation">
            ${formatCurrency(this.overview.savings, currency)} = 
            ${formatCurrency(this.overview.net_income, currency)} - 
            ${formatCurrency(this.overview.target_salary, currency)} - 
            ${formatCurrency(this.overview.taxes_to_set_aside, currency)}
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Attach Event Listeners
   */
  attachEventListeners() {
    const select = this.shadowRoot.querySelector('#month-select');
    if (select) {
      select.addEventListener('change', (e) => {
        const [year, month] = e.target.value.split('-');
        this.selectedYear = parseInt(year);
        this.selectedMonth = parseInt(month);
        this.loadOverview();
      });
    }
  }
  
  /**
   * Render Component
   */
  render() {
    const months = this.getAvailableMonths();
    const currentValue = `${this.selectedYear}-${this.selectedMonth}`;
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .month-selector {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 0.75rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        
        .selector-label {
          color: #ffffff;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          display: block;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .selector-control {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .month-select {
          flex: 1;
          padding: 0.75rem 1rem;
          font-size: 1.125rem;
          font-weight: 600;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 0.5rem;
          background-color: rgba(255, 255, 255, 0.95);
          color: #1f2937;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .month-select:hover {
          background-color: #ffffff;
          border-color: rgba(255, 255, 255, 0.5);
        }
        
        .month-select:focus {
          outline: none;
          border-color: #ffffff;
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
        }
        
        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .overview-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .overview-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        
        .card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        
        .card-icon {
          font-size: 1.5rem;
        }
        
        .card-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #6b7280;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .card-value {
          font-size: 1.875rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }
        
        .card-value.positive {
          color: #10b981;
        }
        
        .card-value.negative {
          color: #ef4444;
        }
        
        .card-detail {
          font-size: 0.875rem;
          color: #6b7280;
        }
        
        .salary-breakdown {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 2rem;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
        }
        
        .breakdown-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 1.5rem 0;
        }
        
        .breakdown-grid {
          display: grid;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .breakdown-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          transition: background-color 0.2s;
        }
        
        .breakdown-item:hover {
          background: #f3f4f6;
        }
        
        .breakdown-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 600;
          color: #374151;
        }
        
        .breakdown-icon {
          font-size: 1.5rem;
        }
        
        .breakdown-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
        }
        
        .breakdown-value.positive {
          color: #10b981;
        }
        
        .breakdown-value.negative {
          color: #ef4444;
        }
        
        .breakdown-note {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.25rem;
          text-align: right;
        }
        
        .formula-box {
          padding: 1.5rem;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 2px solid #fbbf24;
          border-radius: 0.5rem;
          margin-top: 1.5rem;
        }
        
        .formula-title {
          font-size: 1rem;
          font-weight: 700;
          color: #92400e;
          margin: 0 0 0.75rem 0;
        }
        
        .formula-text {
          font-size: 0.875rem;
          color: #78350f;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        
        .formula-calculation {
          font-size: 0.875rem;
          color: #78350f;
          font-family: 'Courier New', monospace;
          background: rgba(255, 255, 255, 0.5);
          padding: 0.5rem;
          border-radius: 0.25rem;
        }
        
        .loading {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
          font-size: 1.125rem;
        }
        
        @media (max-width: 768px) {
          .overview-grid {
            grid-template-columns: 1fr;
          }
          
          .breakdown-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          
          .breakdown-note {
            text-align: left;
          }
        }
      </style>
      
      <div class="month-selector">
        <label class="selector-label">Seleziona Mese</label>
        <div class="selector-control">
          <select id="month-select" class="month-select">
            ${months.map(m => `
              <option value="${m.year}-${m.month}" ${currentValue === `${m.year}-${m.month}` ? 'selected' : ''}>
                ${m.label.charAt(0).toUpperCase() + m.label.slice(1)}
              </option>
            `).join('')}
          </select>
        </div>
      </div>
      
      ${this.renderOverview()}
    `;
    
    this.attachEventListeners();
  }
}

// Register the custom element
customElements.define('monthly-overview', MonthlyOverview);

