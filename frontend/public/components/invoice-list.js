/**
 * Invoice List Component
 * 
 * Custom Web Component that displays a table of all invoices.
 * Supports viewing, editing, and deleting invoices.
 * 
 * Usage:
 * <invoice-list></invoice-list>
 */

class InvoiceList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.invoices = [];
    this.filters = {
      status: null,
      clientName: null,
      startDate: null,
      endDate: null
    };
  }
  
  connectedCallback() {
    this.render();
    this.loadInvoices();
    
    // Listen for data changes to auto-refresh
    this.boundReload = () => this.loadInvoices();
    window.addEventListener(window.AppEvents?.INVOICES_CHANGED || 'data:invoices:changed', this.boundReload);
  }
  
  disconnectedCallback() {
    // Clean up event listener
    if (this.boundReload) {
      window.removeEventListener(window.AppEvents?.INVOICES_CHANGED || 'data:invoices:changed', this.boundReload);
    }
  }
  
  async loadInvoices() {
    try {
      // Build filters object
      const filters = {};
      if (this.filters.status) {
        filters.status = this.filters.status;
      }
      if (this.filters.clientName) {
        filters.clientName = this.filters.clientName;
      }
      if (this.filters.startDate) {
        filters.startDate = this.filters.startDate;
      }
      if (this.filters.endDate) {
        filters.endDate = this.filters.endDate;
      }
      
      this.invoices = await API.invoices.getAll(filters);
      this.render();
    } catch (error) {
      console.error('Failed to load invoices:', error);
      showNotification('Impossibile caricare le fatture', 'error');
    }
  }
  
  applyFilters() {
    const statusSelect = this.shadowRoot.querySelector('#filter-status');
    const clientInput = this.shadowRoot.querySelector('#filter-client');
    const startDateInput = this.shadowRoot.querySelector('#filter-start-date');
    const endDateInput = this.shadowRoot.querySelector('#filter-end-date');
    
    this.filters.status = statusSelect?.value || null;
    this.filters.clientName = clientInput?.value || null;
    this.filters.startDate = startDateInput?.value || null;
    this.filters.endDate = endDateInput?.value || null;
    
    this.loadInvoices();
  }
  
  clearFilters() {
    this.filters = {
      status: null,
      clientName: null,
      startDate: null,
      endDate: null
    };
    this.loadInvoices();
  }
  
  async deleteInvoice(id) {
    if (!confirm('Sei sicuro di voler eliminare questa fattura?')) {
      return;
    }
    
    try {
      await API.invoices.delete(id);
      showNotification('Fattura eliminata con successo', 'success');
      // Emit event instead of manual reload
      window.emitDataChange?.(window.AppEvents?.INVOICES_CHANGED || 'data:invoices:changed');
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      showNotification('Impossibile eliminare la fattura', 'error');
    }
  }
  
  editInvoice(invoice) {
    const form = document.querySelector('invoice-form');
    if (form) {
      form.show(invoice);
    }
  }
  
  async updateStatus(id, status) {
    try {
      await API.invoices.updateStatus(id, status);
      showNotification('Stato fattura aggiornato', 'success');
      // Emit event instead of manual reload
      window.emitDataChange?.(window.AppEvents?.INVOICES_CHANGED || 'data:invoices:changed');
    } catch (error) {
      console.error('Failed to update status:', error);
      showNotification('Impossibile aggiornare lo stato', 'error');
    }
  }
  
  calculateTotal() {
    return this.invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
  }
  
  render() {
    const currency = window.AppState?.settings?.currency || 'EUR';
    const total = this.calculateTotal();
    
    this.shadowRoot.innerHTML = `
      <style>
        :host { 
          display: block;
          margin-top: var(--space-lg);
        }
        .filters-bar {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background-color: var(--color-bg-secondary);
          border-radius: 0.375rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          align-items: end;
        }
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          min-width: 150px;
        }
        .filter-group label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-secondary);
          text-transform: uppercase;
        }
        .filter-group select,
        .filter-group input {
          padding: 0.5rem;
          border: 1px solid var(--color-border);
          border-radius: 0.375rem;
          background-color: var(--color-bg);
          color: var(--color-text-primary);
          font-size: 0.875rem;
        }
        .filter-actions {
          display: flex;
          gap: 0.5rem;
        }
        .total-banner {
          padding: 1rem;
          background-color: var(--color-primary);
          color: white;
          border-radius: 0.375rem;
          margin-bottom: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
        }
        .total-banner .total-label {
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .total-banner .total-amount {
          font-size: 1.5rem;
        }
        .table-container { overflow-x: auto; border-radius: 0.375rem; border: 1px solid var(--color-border); }
        .table { width: 100%; border-collapse: collapse; background-color: var(--color-bg); }
        .table thead { background-color: var(--color-bg-tertiary); border-bottom: 2px solid var(--color-border); }
        .table th { padding: 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; }
        .table td { padding: 1rem; border-bottom: 1px solid var(--color-border); font-size: 0.875rem; color: var(--color-text-primary); }
        .table tbody tr:hover { background-color: var(--color-bg-secondary); }
        .table tbody tr:last-child td { border-bottom: none; }
        .badge { display: inline-block; padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; border-radius: 9999px; }
        .badge-draft { background-color: #f3f4f6; color: var(--color-text-primary); }
        .badge-sent { background-color: #dbeafe; color: #1e40af; }
        .badge-paid { background-color: #d1fae5; color: #065f46; }
        .badge-overdue { background-color: #fee2e2; color: #991b1b; }
        .actions { display: flex; gap: 0.5rem; }
        .btn { padding: 0.5rem 1rem; font-size: 0.875rem; border: none; border-radius: 0.375rem; cursor: pointer; transition: opacity 0.2s; }
        .btn:hover { opacity: 0.9; }
        .btn-sm { font-size: 0.75rem; padding: 0.25rem 0.5rem; }
        .btn-primary { background-color: var(--color-primary); color: white; }
        .btn-secondary { background-color: var(--color-bg-tertiary); color: var(--color-text-primary); }
        .btn-success { background-color: var(--color-success); color: white; }
        .btn-danger { background-color: var(--color-danger); color: white; }
        .empty { text-align: center; padding: 3rem; color: var(--color-text-secondary); }
      </style>
      
      <div class="filters-bar">
        <div class="filter-group">
          <label for="filter-status">Stato</label>
          <select id="filter-status">
            <option value="">Tutti gli stati</option>
            <option value="draft" ${this.filters.status === 'draft' ? 'selected' : ''}>Bozza</option>
            <option value="sent" ${this.filters.status === 'sent' ? 'selected' : ''}>Inviata</option>
            <option value="paid" ${this.filters.status === 'paid' ? 'selected' : ''}>Pagata</option>
            <option value="overdue" ${this.filters.status === 'overdue' ? 'selected' : ''}>Scaduta</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="filter-client">Cliente</label>
          <input type="text" id="filter-client" placeholder="Nome cliente..." value="${this.filters.clientName || ''}">
        </div>
        
        <div class="filter-group">
          <label for="filter-start-date">Da</label>
          <input type="date" id="filter-start-date" value="${this.filters.startDate || ''}">
        </div>
        
        <div class="filter-group">
          <label for="filter-end-date">A</label>
          <input type="date" id="filter-end-date" value="${this.filters.endDate || ''}">
        </div>
        
        <div class="filter-actions">
          <button class="btn btn-primary" id="apply-filters">Filtra</button>
          <button class="btn btn-secondary" id="clear-filters">Reset</button>
        </div>
      </div>
      
      ${this.invoices.length > 0 ? `
        <div class="total-banner">
          <span class="total-label">Totale Fatture (${this.invoices.length})</span>
          <span class="total-amount">${formatCurrency(total, currency)}</span>
        </div>
        ${this.renderTable(currency)}
      ` : '<div class="empty">Nessuna fattura trovata con questi filtri.</div>'}
    `;
    
    this.attachEventListeners();
  }
  
  renderTable(currency) {
    return `
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Fattura #</th>
              <th>Cliente</th>
              <th>Importo</th>
              <th>Stato</th>
              <th>Data Emissione</th>
              <th>Scadenza</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            ${this.invoices.map(inv => `
              <tr>
                <td>${inv.invoice_number}</td>
                <td>${inv.client_name}</td>
                <td>
                  ${formatCurrency(inv.amount, currency)}
                  ${inv.tax_rate > 0 ? `<br><small style="color: var(--color-text-secondary); font-size: 0.75rem;">+ IVA ${inv.tax_rate}%</small>` : '<br><small style="color: var(--color-text-secondary); font-size: 0.75rem;">IVA esclusa</small>'}
                </td>
                <td><span class="badge ${getStatusBadgeClass(inv.status)}">${getStatusLabel(inv.status)}</span></td>
                <td>${formatDate(inv.issue_date, 'short')}</td>
                <td>${formatDate(inv.due_date, 'short')}</td>
                <td>
                  <div class="actions">
                    <button class="btn btn-primary btn-sm" data-action="edit" data-id="${inv.id}">Modifica</button>
                    ${inv.status !== 'paid' ? `<button class="btn btn-success btn-sm" data-action="mark-paid" data-id="${inv.id}">Pagata</button>` : ''}
                    <button class="btn btn-danger btn-sm" data-action="delete" data-id="${inv.id}">Elimina</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  
  attachEventListeners() {
    // Filter buttons
    const applyBtn = this.shadowRoot.querySelector('#apply-filters');
    const clearBtn = this.shadowRoot.querySelector('#clear-filters');
    
    if (applyBtn) {
      applyBtn.addEventListener('click', () => this.applyFilters());
    }
    
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearFilters());
    }
    
    // Action buttons
    this.shadowRoot.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.action;
        const id = parseInt(btn.dataset.id);
        const invoice = this.invoices.find(inv => inv.id === id);
        
        if (action === 'edit' && invoice) {
          this.editInvoice(invoice);
        } else if (action === 'delete') {
          this.deleteInvoice(id);
        } else if (action === 'mark-paid') {
          this.updateStatus(id, 'paid');
        }
      });
    });
  }
}

customElements.define('invoice-list', InvoiceList);

