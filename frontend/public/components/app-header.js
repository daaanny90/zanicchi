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
  /**
   * Constructor
   * Called when component is created
   */
  constructor() {
    super();
    // Attach shadow DOM for style encapsulation
    this.attachShadow({ mode: 'open' });
  }
  
  /**
   * Connected Callback
   * Called when component is added to the DOM
   */
  connectedCallback() {
    this.render();
    this.attachEvents();
  }
  
  /**
   * Render Component
   * Creates the component's HTML and styles
   */
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        /* Component-specific styles */
        :host {
          display: block;
        }
        
        .header {
          background-color: #ffffff;
          border-bottom: 1px solid #e5e7eb;
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
          color: #111827;
          margin: 0;
        }
        
        .tagline {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }
        
        .actions button {
          border: none;
          background: #2563eb;
          color: #fff;
          padding: 0.55rem 1.25rem;
          border-radius: 999px;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          box-shadow: 0 10px 15px -3px rgb(37 99 235 / 0.4);
        }

        .actions button:focus-visible {
          outline: 2px solid #93c5fd;
          outline-offset: 2px;
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
  }
}

// Register the custom element
customElements.define('app-header', AppHeader);

