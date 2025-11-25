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
  }
  
  connectedCallback() {
    this.render();
    this.loadInvoices();
  }
  
  async loadInvoices() {
    try {
      this.invoices = await API.invoices.getAll();
      this.render();
    } catch (error) {
      console.error('Failed to load invoices:', error);
      showNotification('Failed to load invoices', 'error');
    }
  }
  
  async deleteInvoice(id) {
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return;
    }
    
    try {
      await API.invoices.delete(id);
      showNotification('Invoice deleted successfully', 'success');
      this.loadInvoices();
      refreshDashboard();
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      showNotification('Failed to delete invoice', 'error');
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
      showNotification('Invoice status updated', 'success');
      this.loadInvoices();
      refreshDashboard();
    } catch (error) {
      console.error('Failed to update status:', error);
      showNotification('Failed to update status', 'error');
    }
  }
  
  render() {
    const settings = getSettings();
    const currency = settings?.currency || 'EUR';
    
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .table-container { overflow-x: auto; border-radius: 0.75rem; border: 1px solid #e5e7eb; }
        .table { width: 100%; border-collapse: collapse; background-color: #ffffff; }
        .table thead { background-color: #f3f4f6; border-bottom: 2px solid #e5e7eb; }
        .table th { padding: 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; }
        .table td { padding: 1rem; border-bottom: 1px solid #e5e7eb; font-size: 0.875rem; }
        .table tbody tr:hover { background-color: #f9fafb; }
        .table tbody tr:last-child td { border-bottom: none; }
        .badge { display: inline-block; padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; border-radius: 9999px; }
        .badge-draft { background-color: #f3f4f6; color: #374151; }
        .badge-sent { background-color: #dbeafe; color: #1e40af; }
        .badge-paid { background-color: #d1fae5; color: #065f46; }
        .badge-overdue { background-color: #fee2e2; color: #991b1b; }
        .actions { display: flex; gap: 0.5rem; }
        .btn { padding: 0.25rem 0.75rem; font-size: 0.75rem; border: none; border-radius: 0.375rem; cursor: pointer; }
        .btn-sm { font-size: 0.75rem; padding: 0.25rem 0.5rem; }
        .btn-primary { background-color: #2563eb; color: white; }
        .btn-success { background-color: #10b981; color: white; }
        .btn-danger { background-color: #ef4444; color: white; }
        .empty { text-align: center; padding: 3rem; color: #6b7280; }
      </style>
      
      ${this.invoices.length > 0 ? this.renderTable(currency) : '<div class="empty">No invoices yet. Click "New Invoice" to create one.</div>'}
    `;
    
    this.attachEventListeners();
  }
  
  renderTable(currency) {
    return `
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Issue Date</th>
              <th>Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.invoices.map(inv => `
              <tr>
                <td>${inv.invoice_number}</td>
                <td>${inv.client_name}</td>
                <td>${formatCurrency(inv.total_amount, currency)}</td>
                <td><span class="badge ${getStatusBadgeClass(inv.status)}">${getStatusLabel(inv.status)}</span></td>
                <td>${formatDate(inv.issue_date, 'short')}</td>
                <td>${formatDate(inv.due_date, 'short')}</td>
                <td>
                  <div class="actions">
                    <button class="btn btn-primary btn-sm" data-action="edit" data-id="${inv.id}">Edit</button>
                    ${inv.status !== 'paid' ? `<button class="btn btn-success btn-sm" data-action="mark-paid" data-id="${inv.id}">Paid</button>` : ''}
                    <button class="btn btn-danger btn-sm" data-action="delete" data-id="${inv.id}">Delete</button>
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

