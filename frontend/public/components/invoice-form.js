/**
 * Invoice Form Component
 * 
 * Custom Web Component for creating and editing invoices.
 * Modal form with validation.
 * 
 * Usage:
 * <invoice-form></invoice-form>
 */

class InvoiceForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.invoice = null;
  }
  
  connectedCallback() {
    this.render();
  }
  
  show(invoice = null) {
    this.invoice = invoice;
    this.render();
    this.shadowRoot.querySelector('.modal').style.display = 'flex';
    this.attachEventListeners();
  }
  
  hide() {
    this.shadowRoot.querySelector('.modal').style.display = 'none';
    this.invoice = null;
  }
  
  async submitForm(e) {
    e.preventDefault();
    
    const form = this.shadowRoot.querySelector('#invoice-form');
    const formData = new FormData(form);
    
    const data = {
      invoice_number: formData.get('invoice_number'),
      client_name: formData.get('client_name'),
      description: formData.get('description'),
      amount: parseFloat(formData.get('amount')),
      tax_rate: parseFloat(formData.get('tax_rate')),
      status: formData.get('status'),
      issue_date: formData.get('issue_date'),
      due_date: formData.get('due_date')
    };
    
    try {
      if (this.invoice) {
        await API.invoices.update(this.invoice.id, data);
        showNotification('Invoice updated successfully', 'success');
      } else {
        await API.invoices.create(data);
        showNotification('Invoice created successfully', 'success');
      }
      
      this.hide();
      
      const list = document.querySelector('invoice-list');
      if (list && list.loadInvoices) {
        list.loadInvoices();
      }
      
      refreshDashboard();
    } catch (error) {
      console.error('Failed to save invoice:', error);
      showNotification(error.message || 'Failed to save invoice', 'error');
    }
  }
  
  attachEventListeners() {
    const form = this.shadowRoot.querySelector('#invoice-form');
    const closeBtn = this.shadowRoot.querySelector('.close-btn');
    const cancelBtn = this.shadowRoot.querySelector('[data-action="cancel"]');
    
    if (form) {
      form.addEventListener('submit', (e) => this.submitForm(e));
    }
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hide());
    }
  }
  
  render() {
    const settings = getSettings();
    const defaultTaxRate = settings?.default_tax_rate || 22;
    
    this.shadowRoot.innerHTML = `
      <style>
        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center; }
        .modal-content { background: white; border-radius: 0.75rem; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; }
        .modal-header { padding: 1.5rem; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
        .modal-title { font-size: 1.25rem; font-weight: 600; margin: 0; }
        .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6b7280; }
        .modal-body { padding: 1.5rem; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .form-group { margin-bottom: 1rem; }
        .form-group.full { grid-column: 1 / -1; }
        .form-label { display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 500; }
        .form-input, .form-select, .form-textarea { width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 1rem; }
        .form-textarea { min-height: 80px; }
        .modal-footer { padding: 1.5rem; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 1rem; }
        .btn { padding: 0.5rem 1.5rem; border: none; border-radius: 0.375rem; font-size: 1rem; font-weight: 500; cursor: pointer; }
        .btn-primary { background-color: #2563eb; color: white; }
        .btn-secondary { background-color: #e5e7eb; color: #374151; }
      </style>
      
      <div class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">${this.invoice ? 'Edit Invoice' : 'New Invoice'}</h2>
            <button class="close-btn">×</button>
          </div>
          <div class="modal-body">
            <form id="invoice-form">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Invoice Number *</label>
                  <input type="text" name="invoice_number" class="form-input" value="${this.invoice?.invoice_number || ''}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Status</label>
                  <select name="status" class="form-select">
                    <option value="draft" ${!this.invoice || this.invoice.status === 'draft' ? 'selected' : ''}>Draft</option>
                    <option value="sent" ${this.invoice?.status === 'sent' ? 'selected' : ''}>Sent</option>
                    <option value="paid" ${this.invoice?.status === 'paid' ? 'selected' : ''}>Paid</option>
                  </select>
                </div>
                <div class="form-group full">
                  <label class="form-label">Client Name *</label>
                  <input type="text" name="client_name" class="form-input" value="${this.invoice?.client_name || ''}" required>
                </div>
                <div class="form-group full">
                  <label class="form-label">Description</label>
                  <textarea name="description" class="form-textarea">${this.invoice?.description || ''}</textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">Amount *</label>
                  <input type="number" name="amount" class="form-input" value="${this.invoice?.amount || ''}" step="0.01" min="0" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Tax Rate (%)</label>
                  <input type="number" name="tax_rate" class="form-input" value="${this.invoice?.tax_rate || defaultTaxRate}" step="0.01" min="0" max="100">
                </div>
                <div class="form-group">
                  <label class="form-label">Issue Date *</label>
                  <input type="date" name="issue_date" class="form-input" value="${this.invoice?.issue_date || getTodayDate()}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Due Date *</label>
                  <input type="date" name="due_date" class="form-input" value="${this.invoice?.due_date || getTodayDate()}" required>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
            <button type="submit" form="invoice-form" class="btn btn-primary">Save Invoice</button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('invoice-form', InvoiceForm);

