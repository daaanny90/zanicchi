/**
 * Settings Panel Component
 * 
 * Custom Web Component for application settings.
 * Allows users to configure tax rate, currency, etc.
 * 
 * Usage:
 * <settings-panel></settings-panel>
 */

class SettingsPanel extends HTMLElement {
  /**
   * Constructor
   */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.settings = null;
  }
  
  /**
   * Connected Callback
   */
  connectedCallback() {
    this.render();
    this.loadSettings();
  }
  
  /**
   * Load Settings
   */
  async loadSettings() {
    try {
      this.settings = await API.settings.getAll();
      this.render();
      this.attachEventListeners();
    } catch (error) {
      console.error('Failed to load settings:', error);
      showNotification('Impossibile caricare le impostazioni', 'error');
    }
  }
  
  /**
   * Save Settings
   */
  async saveSettings(event) {
    event.preventDefault();
    
    const form = this.shadowRoot.querySelector('#settings-form');
    const formData = new FormData(form);
    
    const updates = {
      default_vat_rate: parseFloat(formData.get('vat_rate')),
      currency: formData.get('currency'),
      currency_symbol: this.getCurrencySymbol(formData.get('currency')),
      target_salary: parseFloat(formData.get('target_salary')),
      taxable_percentage: parseFloat(formData.get('taxable_percentage')),
      income_tax_rate: parseFloat(formData.get('income_tax_rate')),
      health_insurance_rate: parseFloat(formData.get('health_insurance_rate'))
    };
    
    try {
      this.settings = await API.settings.update(updates);
      showNotification('Impostazioni salvate con successo', 'success');
      
      // Update global app state
      if (window.AppState) {
        window.AppState.settings = this.settings;
      }
      
      // Refresh dashboard to show new currency/tax
      refreshDashboard();
    } catch (error) {
      console.error('Failed to save settings:', error);
      showNotification('Impossibile salvare le impostazioni', 'error');
    }
  }
  
  /**
   * Get Currency Symbol
   */
  getCurrencySymbol(currency) {
    const symbols = {
      'EUR': '€',
      'USD': '$',
      'GBP': '£',
      'JPY': '¥'
    };
    return symbols[currency] || currency;
  }
  
  /**
   * Attach Event Listeners
   */
  attachEventListeners() {
    const form = this.shadowRoot.querySelector('#settings-form');
    if (form) {
      form.addEventListener('submit', (e) => this.saveSettings(e));
    }
  }
  
  /**
   * Render Component
   */
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .settings-container {
          max-width: 600px;
        }
        
        .card {
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1.5rem;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        }
        
        .card-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0 0 1.5rem 0;
        }
        
        .form-group {
          margin-bottom: 1.5rem;
        }
        
        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #111827;
        }
        
        .form-help {
          display: block;
          margin-top: 0.25rem;
          font-size: 0.75rem;
          color: #6b7280;
        }
        
        .form-input,
        .form-select {
          width: 100%;
          padding: 0.5rem 0.75rem;
          font-size: 1rem;
          color: #111827;
          background-color: #ffffff;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          transition: border-color 0.15s;
        }
        
        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px #dbeafe;
        }
        
        .btn-primary {
          display: inline-flex;
          align-items: center;
          padding: 0.5rem 1.5rem;
          font-size: 1rem;
          font-weight: 500;
          color: white;
          background-color: #2563eb;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: background-color 0.15s;
        }
        
        .btn-primary:hover {
          background-color: #1d4ed8;
        }
        
        .loading {
          text-align: center;
          padding: 2rem;
          color: #6b7280;
        }
      </style>
      
      <div class="settings-container">
        <div class="card">
          <h2 class="card-title">Impostazioni Applicazione</h2>
          
          ${this.settings ? this.renderForm() : '<div class="loading">Caricamento impostazioni...</div>'}
        </div>
      </div>
    `;
  }
  
  /**
   * Render Settings Form
   */
  renderForm() {
    return `
      <form id="settings-form">
        <h3 style="font-size: 1.1rem; font-weight: 600; margin: 0 0 1rem 0; color: #374151;">
          Valuta
        </h3>
        
        <div class="form-group">
          <label class="form-label" for="currency">Valuta</label>
          <select
            id="currency"
            name="currency"
            class="form-select"
            required
          >
            <option value="EUR" ${this.settings.currency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
            <option value="USD" ${this.settings.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
            <option value="GBP" ${this.settings.currency === 'GBP' ? 'selected' : ''}>GBP (£)</option>
            <option value="JPY" ${this.settings.currency === 'JPY' ? 'selected' : ''}>JPY (¥)</option>
          </select>
          <span class="form-help">
            Valuta utilizzata per tutti gli importi nell'applicazione
          </span>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 1.5rem 0;">
        
        <h3 style="font-size: 1.1rem; font-weight: 600; margin: 0 0 1rem 0; color: #374151;">
          IVA (Fatture)
        </h3>
        
        <div class="form-group">
          <label class="form-label" for="vat-rate">Aliquota IVA Predefinita (%)</label>
          <input
            type="number"
            id="vat-rate"
            name="vat_rate"
            class="form-input"
            value="${this.settings.default_vat_rate || this.settings.default_tax_rate || 22}"
            min="0"
            max="100"
            step="0.01"
            required
          />
          <span class="form-help">
            Questa aliquota IVA verrà applicata di default alle nuove fatture
          </span>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 1.5rem 0;">
        
        <h3 style="font-size: 1.1rem; font-weight: 600; margin: 0 0 1rem 0; color: #374151;">
          Regime Forfettario (Imposte)
        </h3>
        
        <div class="form-group">
          <label class="form-label" for="taxable-percentage">Coefficiente di Redditività (%)</label>
          <input
            type="number"
            id="taxable-percentage"
            name="taxable_percentage"
            class="form-input"
            value="${this.settings.taxable_percentage || 76}"
            min="0"
            max="100"
            step="0.01"
            required
          />
          <span class="form-help">
            Percentuale del reddito lordo che è imponibile (tipicamente 76% per servizi)
          </span>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="income-tax-rate">Aliquota Imposta Sostitutiva (%)</label>
          <input
            type="number"
            id="income-tax-rate"
            name="income_tax_rate"
            class="form-input"
            value="${this.settings.income_tax_rate || 15}"
            min="0"
            max="100"
            step="0.01"
            required
          />
          <span class="form-help">
            Aliquota flat tax sul reddito imponibile (15% standard, 5% primi 5 anni)
          </span>
        </div>
        
        <div class="form-group">
          <label class="form-label" for="health-insurance-rate">Contributi INPS (%)</label>
          <input
            type="number"
            id="health-insurance-rate"
            name="health_insurance_rate"
            class="form-input"
            value="${this.settings.health_insurance_rate || 27}"
            min="0"
            max="100"
            step="0.01"
            required
          />
          <span class="form-help">
            Aliquota contributi previdenziali INPS sul reddito imponibile (tipicamente 27%)
          </span>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 1.5rem 0;">
        
        <h3 style="font-size: 1.1rem; font-weight: 600; margin: 0 0 1rem 0; color: #374151;">
          Obiettivi Personali
        </h3>
        
        <div class="form-group">
          <label class="form-label" for="target-salary">Stipendio Mensile Desiderato</label>
          <input
            type="number"
            id="target-salary"
            name="target_salary"
            class="form-input"
            value="${this.settings.target_salary || 3000}"
            min="0"
            step="100"
            required
          />
          <span class="form-help">
            L'importo netto mensile che desideri portare a casa per le spese personali
          </span>
        </div>
        
        <button type="submit" class="btn-primary">
          Salva Impostazioni
        </button>
      </form>
    `;
  }
}

// Register the custom element
customElements.define('settings-panel', SettingsPanel);

