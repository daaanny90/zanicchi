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
      default_tax_rate: parseFloat(formData.get('tax_rate')),
      currency: formData.get('currency'),
      currency_symbol: this.getCurrencySymbol(formData.get('currency'))
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
        <div class="form-group">
          <label class="form-label" for="tax-rate">Aliquota IVA Predefinita (%)</label>
          <input
            type="number"
            id="tax-rate"
            name="tax_rate"
            class="form-input"
            value="${this.settings.default_tax_rate}"
            min="0"
            max="100"
            step="0.01"
            required
          />
          <span class="form-help">
            Questa aliquota IVA verrà applicata di default alle nuove fatture
          </span>
        </div>
        
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
            L'importo netto mensile che desideri guadagnare. Utilizzato per calcolare risparmi e tasse.
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

