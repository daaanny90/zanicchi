/**
 * Annual Revenue Limit Indicator Component
 * 
 * Custom Web Component that displays the annual revenue limit status
 * for the Italian flat-tax regime (€85,000).
 * 
 * Shows:
 * - Total invoiced revenue for the current year
 * - Remaining amount before hitting the limit
 * - Visual progress bar with color-coded risk levels
 * - Status indicators (safe, attention, critical)
 * 
 * Usage:
 * <annual-limit-indicator></annual-limit-indicator>
 */

class AnnualLimitIndicator extends HTMLElement {
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
    this.loadLimitData();
    
    // Listen for invoice changes to auto-refresh
    this.boundReload = () => this.loadLimitData();
    window.addEventListener(window.AppEvents?.INVOICES_CHANGED || 'data:invoices:changed', this.boundReload);
  }
  
  /**
   * Disconnected Callback
   */
  disconnectedCallback() {
    // Clean up event listener
    if (this.boundReload) {
      window.removeEventListener(window.AppEvents?.INVOICES_CHANGED || 'data:invoices:changed', this.boundReload);
    }
  }
  
  /**
   * Load Annual Limit Data
   */
  async loadLimitData() {
    try {
      this.data = await API.dashboard.getAnnualLimit();
      this.render();
    } catch (error) {
      console.error('Failed to load annual limit data:', error);
      this.showError();
    }
  }
  
  /**
   * Get status configuration based on risk level
   */
  getStatusConfig() {
    if (!this.data) return null;
    
    const configs = {
      safe: {
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 0.3)',
        icon: '✅',
        title: 'Zona Sicura',
        message: 'Puoi continuare a fatturare senza preoccupazioni. Contano solo le fatture pagate nell\'anno corrente.',
        gradient: 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
      },
      attention: {
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
        icon: '⚠️',
        title: 'Zona di Attenzione',
        message: 'Stai avvicinandoti al limite. Monitora i pagamenti ricevuti quest\'anno.',
        gradient: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
      },
      critical: {
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
        icon: '🚨',
        title: 'Zona Critica',
        message: 'Attenzione! Hai quasi raggiunto il limite annuale di €85.000 (pagamenti incassati).',
        gradient: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
      }
    };
    
    return configs[this.data.status];
  }
  
  /**
   * Render Component
   */
  render() {
    const settings = window.AppState?.settings;
    const currency = settings?.currency || 'EUR';
    
    if (!this.data) {
      this.shadowRoot.innerHTML = `
        <style>
          .loading {
            text-align: center;
            padding: 2rem;
            color: var(--color-text-secondary);
          }
        </style>
        <div class="loading">Caricamento limite annuale...</div>
      `;
      return;
    }
    
    const statusConfig = this.getStatusConfig();
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-bottom: var(--space-xl);
        }
        
        .limit-card {
          background: var(--color-bg);
          border: 2px solid ${statusConfig.borderColor};
          border-radius: 0.375rem;
          padding: 2rem;
          box-shadow: 0 2px 4px 0 rgb(0 0 0 / 0.06);
          position: relative;
          overflow: hidden;
        }
        
        .limit-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: ${statusConfig.gradient};
        }
        
        .limit-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .limit-title-section {
          flex: 1;
        }
        
        .limit-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0 0 0.25rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .limit-icon {
          font-size: 1.5rem;
        }
        
        .limit-subtitle {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          margin: 0;
        }
        
        .status-badge {
          background: ${statusConfig.bgColor};
          border: 1px solid ${statusConfig.borderColor};
          color: ${statusConfig.color};
          padding: 0.5rem 1rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .metric-card {
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: 0.25rem;
          padding: 1rem;
        }
        
        .metric-label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-secondary);
          margin-bottom: 0.5rem;
        }
        
        .metric-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0;
        }
        
        .metric-subtext {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          margin-top: 0.25rem;
        }
        
        .progress-section {
          margin-bottom: 1.5rem;
        }
        
        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        
        .progress-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text-primary);
        }
        
        .progress-percentage {
          font-size: 1.25rem;
          font-weight: 700;
          color: ${statusConfig.color};
        }
        
        .progress-bar {
          width: 100%;
          height: 2rem;
          background: var(--color-bg-secondary);
          border-radius: 1rem;
          overflow: hidden;
          border: 2px solid var(--color-border);
          position: relative;
        }
        
        .progress-fill {
          height: 100%;
          background: ${statusConfig.gradient};
          width: ${this.data.percentage_used}%;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 0.75rem;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .progress-fill-text {
          color: white;
          font-weight: 700;
          font-size: 0.875rem;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .progress-markers {
          display: flex;
          justify-content: space-between;
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          padding: 0 0.25rem;
        }
        
        .status-message {
          background: ${statusConfig.bgColor};
          border: 1px solid ${statusConfig.borderColor};
          border-radius: 0.25rem;
          padding: 1rem;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }
        
        .message-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }
        
        .message-content {
          flex: 1;
        }
        
        .message-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: ${statusConfig.color};
          margin: 0 0 0.25rem 0;
        }
        
        .message-text {
          font-size: 0.875rem;
          color: var(--color-text-primary);
          margin: 0;
          line-height: 1.5;
        }
        
        .error {
          text-align: center;
          padding: 2rem;
          color: var(--color-danger);
        }
        
        @media (max-width: 768px) {
          .limit-card {
            padding: 1.5rem;
          }
          
          .metrics-grid {
            grid-template-columns: 1fr;
          }
          
          .limit-header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .status-badge {
            justify-content: center;
          }
        }
      </style>
      
      <div class="limit-card">
        <div class="limit-header">
          <div class="limit-title-section">
            <h2 class="limit-title">
              <span class="limit-icon">💼</span>
              Limite Regime Forfettario
            </h2>
            <p class="limit-subtitle">Anno ${this.data.year} • Solo fatture PAGATE (cassa)</p>
          </div>
          <div class="status-badge">
            <span>${statusConfig.icon}</span>
            <span>${statusConfig.title}</span>
          </div>
        </div>
        
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Incassato ${this.data.year}</div>
            <p class="metric-value">${formatCurrency(this.data.total_invoiced, currency)}</p>
            <div class="metric-subtext">${this.data.invoice_count} fattura/e pagate quest'anno</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-label">Limite Annuale</div>
            <p class="metric-value">${formatCurrency(this.data.limit, currency)}</p>
            <div class="metric-subtext">Regime Forfettario</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-label">Disponibile</div>
            <p class="metric-value" style="color: ${statusConfig.color};">
              ${formatCurrency(this.data.remaining, currency)}
            </p>
            <div class="metric-subtext">Prima del limite</div>
          </div>
        </div>
        
        <div class="progress-section">
          <div class="progress-header">
            <span class="progress-label">Utilizzo del Limite</span>
            <span class="progress-percentage">${this.data.percentage_used.toFixed(1)}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill">
              ${this.data.percentage_used >= 15 ? `<span class="progress-fill-text">${this.data.percentage_used.toFixed(0)}%</span>` : ''}
            </div>
          </div>
          <div class="progress-markers">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>70% ⚠️</span>
            <span>90% 🚨</span>
            <span>100%</span>
          </div>
        </div>
        
        <div class="status-message">
          <span class="message-icon">${statusConfig.icon}</span>
          <div class="message-content">
            <p class="message-title">${statusConfig.title}</p>
            <p class="message-text">${statusConfig.message}</p>
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
        .error {
          text-align: center;
          padding: 2rem;
          color: var(--color-danger);
        }
      </style>
      <div class="error">Impossibile caricare il limite annuale.</div>
    `;
  }
}

// Register the custom element
customElements.define('annual-limit-indicator', AnnualLimitIndicator);

