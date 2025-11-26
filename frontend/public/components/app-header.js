/**
 * App Header Component
 * 
 * Custom Web Component for the application header.
 * Displays the app title and branding.
 * 
 * Usage:
 * <app-header></app-header>
 */

class AppHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isDark = document.body.classList.contains('dark-theme');
    this.handleThemeChange = this.handleThemeChange.bind(this);
  }
  
  connectedCallback() {
    this.render();
    this.attachEvents();
    window.addEventListener('theme:changed', this.handleThemeChange);
  }
  
  disconnectedCallback() {
    window.removeEventListener('theme:changed', this.handleThemeChange);
  }

  handleThemeChange(event) {
    this.isDark = event.detail?.theme === 'dark';
    this.render();
    this.attachEvents();
  }
  
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .header {
          background-color: var(--color-bg);
          border-bottom: 1px solid var(--color-border);
          padding: 1rem 2rem;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        }
        
        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .logo-icon {
          font-size: 2rem;
        }
        
        .logo-text {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0;
        }
        
        .tagline {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          margin: 0;
        }

        .actions {
          display: flex;
          gap: 0.5rem;
        }
        
        .actions button {
          border: none;
          background: var(--color-primary);
          color: #fff;
          padding: 0.55rem 1.25rem;
          border-radius: 999px;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          box-shadow: 0 2px 4px 0 rgb(30 64 175 / 0.15);
          transition: background-color var(--transition-fast), border-color var(--transition-fast);
        }

        .actions button:focus-visible {
          outline: 2px solid var(--color-primary-light);
          outline-offset: 2px;
        }

        .actions button:hover {
          background: var(--color-primary-hover);
        }

        .theme-toggle {
          background: var(--color-bg-tertiary);
          color: var(--color-text-primary);
          border: 1px solid var(--color-border);
          padding: 0.45rem 0.8rem;
          box-shadow: none;
        }

        .theme-toggle:hover {
          background: var(--color-bg-secondary);
        }

        @media (max-width: 768px) {
          .header {
            padding: 1rem;
          }
          
          .logo-text {
            font-size: 1rem;
          }
          
          .tagline {
            display: none;
          }
        }
      </style>
      
      <header class="header">
        <div class="header-content">
          <div class="logo">
            <span class="logo-icon">💼</span>
            <div>
              <h1 class="logo-text">Finanze Freelance</h1>
              <p class="tagline">Gestisci le tue finanze da freelance con facilità</p>
            </div>
          </div>
          <div class="actions">
            <button id="header-log-hours">
              <span>⏱️</span>
              <span>Registra Ore</span>
            </button>
            <button class="theme-toggle" id="header-theme-toggle" title="Cambia tema">
              ${this.isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>
    `;
  }

  attachEvents() {
    const logBtn = this.shadowRoot.querySelector('#header-log-hours');
    if (logBtn) {
      logBtn.addEventListener('click', () => {
        const defaultDate = typeof getTodayDate === 'function'
          ? getTodayDate()
          : new Date().toISOString().split('T')[0];
        window.dispatchEvent(new CustomEvent('worked-hours:open-modal', {
          detail: { defaultDate }
        }));
      });
    }

    const themeBtn = this.shadowRoot.querySelector('#header-theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        if (window.AppTheme?.toggle) {
          window.AppTheme.toggle();
        }
      });
    }
  }
}

// Register the custom element
customElements.define('app-header', AppHeader);

