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
              <h1 class="logo-text">Freelancer Finance</h1>
              <p class="tagline">Manage your freelance finances with ease</p>
            </div>
          </div>
        </div>
      </header>
    `;
  }
}

// Register the custom element
customElements.define('app-header', AppHeader);

