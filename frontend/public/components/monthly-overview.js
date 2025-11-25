/**
 * Monthly Overview Component
 * 
 * Custom Web Component for displaying comprehensive monthly financial overview
 * with salary-based calculations.
 * 
 * **IMPORTANT: Income is calculated from worked hours (hours × rate), NOT from invoices.**
 * This is the single source of truth for monthly accounting.
 * 
 * Features:
 * - Month selector (dropdown to view different months)
 * - Income from logged work hours, expenses, and tax breakdown
 * - Target salary tracking
 * - Taxes to set aside calculation
 * - Savings calculation
 * - Italian "Regime Forfettario" tax calculations
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
   * Load application settings (for target salary and Italian tax rates)
   */
  async loadSettings() {
    try {
      const settings = await API.settings.getAll();
      this.settings = {
        target_salary: parseFloat(settings.target_salary || 3000),
        taxable_percentage: parseFloat(settings.taxable_percentage || 76),
        income_tax_rate: parseFloat(settings.income_tax_rate || 15),
        health_insurance_rate: parseFloat(settings.health_insurance_rate || 27),
        currency: settings.currency || 'EUR',
        currency_symbol: settings.currency_symbol || '€'
      };
      // After settings are loaded, load the overview
      await this.loadOverview();
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Try to load with defaults even if settings fail
      this.settings = {
        target_salary: 3000,
        taxable_percentage: 67,
        income_tax_rate: 15,
        health_insurance_rate: 26.07,
        currency: 'EUR',
        currency_symbol: '€'
      };
      await this.loadOverview();
    }
  }

  notifyMonthChange() {
    window.dispatchEvent(new CustomEvent('monthly:monthChanged', {
      detail: {
        year: this.selectedYear,
        month: this.selectedMonth
      }
    }));
  }
  
  /**
   * Load monthly overview data
   */
  async loadOverview() {
    if (!this.settings) {
      console.error('Settings not loaded yet');
      return;
    }

    this.notifyMonthChange();
    
    try {
      console.log('Loading monthly overview:', {
        year: this.selectedYear,
        month: this.selectedMonth,
        targetSalary: this.settings.target_salary,
        taxablePercentage: this.settings.taxable_percentage,
        incomeTaxRate: this.settings.income_tax_rate,
        healthInsuranceRate: this.settings.health_insurance_rate
      });
      
      const data = await API.dashboard.getMonthlyOverview(
        this.selectedYear,
        this.selectedMonth,
        this.settings.target_salary,
        this.settings.taxable_percentage,
        this.settings.income_tax_rate,
        this.settings.health_insurance_rate
      );
      
      this.overview = data;
      this.render();
    } catch (error) {
      console.error('Failed to load monthly overview:', error);
      this.showError();
    }
  }
  
  /**
   * Show error message
   */
  showError() {
    this.overview = 'error';
    this.render();
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
    // Show error if failed to load
    if (this.overview === 'error') {
      return '<div class="error">Impossibile caricare la panoramica mensile. Riprova.</div>';
    }
    
    // Show loading state
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
            <h3 class="card-title">Entrate Lorde (da Ore)</h3>
          </div>
          <div class="card-value positive">${formatCurrency(this.overview.total_income, currency)}</div>
          <div class="card-detail">${this.overview.invoice_count} registrazione/i ore</div>
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
        
        <!-- VAT Collected Section -->
        <div class="overview-card vat-card">
          <div class="card-header">
            <span class="card-icon">🏛️</span>
            <h3 class="card-title">IVA Riscossa</h3>
          </div>
          <div class="card-value">${formatCurrency(this.overview.total_vat, currency)}</div>
          <div class="card-detail">Da versare allo Stato</div>
        </div>
        
        <!-- Taxable Income Section -->
        <div class="overview-card taxable-card">
          <div class="card-header">
            <span class="card-icon">📐</span>
            <h3 class="card-title">Reddito Imponibile</h3>
          </div>
          <div class="card-value">${formatCurrency(this.overview.taxable_income, currency)}</div>
          <div class="card-detail">${this.settings.taxable_percentage}% delle entrate</div>
        </div>
      </div>
      
      <!-- Italian Tax Breakdown -->
      <div class="salary-breakdown">
        <h3 class="breakdown-title">Imposte e Contributi (Regime Forfettario)</h3>
        <div class="breakdown-grid">
          <!-- Health Insurance (INPS) - DEDUCTIBLE -->
          <div class="breakdown-item inps-item">
            <div class="breakdown-label">
              <span class="breakdown-icon">🏥</span>
              <span>Contributi INPS</span>
            </div>
            <div class="breakdown-value">${formatCurrency(this.overview.health_insurance, currency)}</div>
            <div class="breakdown-note">${this.settings.health_insurance_rate}% del reddito imponibile (deducibile)</div>
          </div>
          
          <!-- Income for Tax (after INPS deduction) -->
          <div class="breakdown-item taxable-card">
            <div class="breakdown-label">
              <span class="breakdown-icon">📉</span>
              <span>Reddito per Imposte</span>
            </div>
            <div class="breakdown-value">${formatCurrency(this.overview.income_for_tax, currency)}</div>
            <div class="breakdown-note">Dopo deduzione INPS</div>
          </div>
          
          <!-- Income Tax -->
          <div class="breakdown-item tax-item">
            <div class="breakdown-label">
              <span class="breakdown-icon">📋</span>
              <span>Imposta Sostitutiva</span>
            </div>
            <div class="breakdown-value">${formatCurrency(this.overview.income_tax, currency)}</div>
            <div class="breakdown-note">${this.settings.income_tax_rate}% del reddito per imposte</div>
          </div>
          
          <!-- Total Tax Burden -->
          <div class="breakdown-item total-tax-item">
            <div class="breakdown-label">
              <span class="breakdown-icon">🔢</span>
              <span>Totale Imposte</span>
            </div>
            <div class="breakdown-value">${formatCurrency(this.overview.total_tax_burden, currency)}</div>
            <div class="breakdown-note">INPS + Imposta Sostitutiva</div>
          </div>
        </div>
      </div>
      
      <!-- Net Income and Savings -->
      <div class="salary-breakdown">
        <h3 class="breakdown-title">Reddito Netto e Risparmi</h3>
        <div class="breakdown-grid">
          <!-- Net Income -->
          <div class="breakdown-item net-item">
            <div class="breakdown-label">
              <span class="breakdown-icon">📊</span>
              <span>Reddito Netto</span>
            </div>
            <div class="breakdown-value ${this.overview.net_income >= 0 ? 'positive' : 'negative'}">
              ${formatCurrency(this.overview.net_income, currency)}
            </div>
            <div class="breakdown-note">Dopo spese e imposte</div>
          </div>
          
          <!-- Target Salary -->
          <div class="breakdown-item salary-item">
            <div class="breakdown-label">
              <span class="breakdown-icon">💼</span>
              <span>Stipendio Desiderato</span>
            </div>
            <div class="breakdown-value">${formatCurrency(this.overview.target_salary, currency)}</div>
            <div class="breakdown-note">Obiettivo mensile</div>
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
            <div class="breakdown-note">Reddito netto - Stipendio</div>
          </div>
        </div>
        
        <!-- Summary Formula -->
        <div class="formula-box">
          <h4 class="formula-title">Formula di Calcolo (Regime Forfettario):</h4>
          <div class="formula-text" style="font-size: 0.875rem; margin-bottom: 0.5rem; background: rgba(59, 130, 246, 0.1); padding: 0.5rem; border-radius: 0.375rem;">
            <strong>Entrate da Ore Lavorate:</strong> Ore registrate × Tariffa oraria
          </div>
          <div class="formula-text" style="font-size: 0.875rem; margin-bottom: 0.5rem;">
            1. Reddito Imponibile = Entrate × ${this.settings.taxable_percentage}%
          </div>
          <div class="formula-text" style="font-size: 0.875rem; margin-bottom: 0.5rem;">
            2. INPS = Reddito Imponibile × ${this.settings.health_insurance_rate}% = ${formatCurrency(this.overview.health_insurance, currency)}
          </div>
          <div class="formula-text" style="font-size: 0.875rem; margin-bottom: 0.5rem;">
            3. Reddito per Imposte = Reddito Imponibile − INPS = ${formatCurrency(this.overview.income_for_tax, currency)}
          </div>
          <div class="formula-text" style="font-size: 0.875rem; margin-bottom: 0.5rem;">
            4. Imposta Sostitutiva = Reddito per Imposte × ${this.settings.income_tax_rate}% = ${formatCurrency(this.overview.income_tax, currency)}
          </div>
          <div class="formula-text" style="font-weight: 600; margin-top: 1rem;">
            Reddito Netto = Entrate (da ore) − Spese − INPS − Imposta Sostitutiva
          </div>
          <div class="formula-calculation">
            ${formatCurrency(this.overview.net_income, currency)} = 
            ${formatCurrency(this.overview.total_income, currency)} − 
            ${formatCurrency(this.overview.total_expenses, currency)} − 
            ${formatCurrency(this.overview.health_insurance, currency)} − 
            ${formatCurrency(this.overview.income_tax, currency)}
          </div>
          <div class="formula-text" style="margin-top: 1rem;">
            Risparmi = Reddito Netto − Stipendio Desiderato
          </div>
          <div class="formula-calculation">
            ${formatCurrency(this.overview.savings, currency)} = 
            ${formatCurrency(this.overview.net_income, currency)} − 
            ${formatCurrency(this.overview.target_salary, currency)}
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
        this.notifyMonthChange();
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
          background: linear-gradient(135deg, var(--gradient-primary-start) 0%, var(--gradient-primary-end) 100%);
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
          background-color: var(--color-bg);
          color: var(--color-text-primary);
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .month-select:hover {
          background-color: var(--color-bg);
          border-color: rgba(255, 255, 255, 0.5);
        }
        
        .month-select:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.9);
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
        }
        
        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .overview-card {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
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
          color: var(--color-text-secondary);
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .card-value {
          font-size: 1.875rem;
          font-weight: 700;
          color: var(--color-text-primary);
          margin-bottom: 0.5rem;
        }
        
        .card-value.positive {
          color: var(--color-success);
        }
        
        .card-value.negative {
          color: var(--color-danger);
        }
        
        .card-detail {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
        }
        
        .salary-breakdown {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 0.75rem;
          padding: 2rem;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
        }
        
        .breakdown-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-text-primary);
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
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: 0.5rem;
          transition: background-color 0.2s;
        }
        
        .breakdown-item:hover {
          background: var(--color-bg-tertiary);
        }
        
        .breakdown-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 600;
          color: var(--color-text-primary);
        }
        
        .breakdown-icon {
          font-size: 1.5rem;
        }
        
        .breakdown-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-text-primary);
        }
        
        .breakdown-value.positive {
          color: var(--color-success);
        }
        
        .breakdown-value.negative {
          color: var(--color-danger);
        }
        
        .breakdown-note {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          margin-top: 0.25rem;
          text-align: right;
        }
        
        .formula-box {
          padding: 1.5rem;
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: 0.5rem;
          margin-top: 1.5rem;
        }
        
        .formula-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0 0 0.75rem 0;
        }
        
        .formula-text {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        
        .formula-calculation {
          font-size: 0.875rem;
          color: var(--color-text-primary);
          font-family: 'Courier New', monospace;
          background: var(--color-bg);
          padding: 0.5rem;
          border-radius: 0.25rem;
          border: 1px solid var(--color-border);
        }
        
        .loading {
          text-align: center;
          padding: 3rem;
          color: var(--color-text-secondary);
          font-size: 1.125rem;
        }
        
        .error {
          text-align: center;
          padding: 3rem;
          color: var(--color-danger);
          font-size: 1.125rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.4);
          border-radius: 0.5rem;
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
      
      <div class="overview-container">
        ${this.renderOverview()}
      </div>
    `;
    
    this.attachEventListeners();
  }
}

// Register the custom element
customElements.define('monthly-overview', MonthlyOverview);

