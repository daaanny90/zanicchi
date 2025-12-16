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
      tax_rate: 0, // Regime Forfettario: no VAT charged to clients
      status: formData.get('status'),
      issue_date: formData.get('issue_date'),
      due_date: formData.get('due_date')
    };
    
    try {
      if (this.invoice) {
        await API.invoices.update(this.invoice.id, data);
        showNotification('Fattura aggiornata con successo', 'success');
      } else {
        await API.invoices.create(data);
        showNotification('Fattura creata con successo', 'success');
      }
      
      this.hide();
      
      // Emit event for reactive updates
      window.emitDataChange?.(window.AppEvents?.INVOICES_CHANGED || 'data:invoices:changed');
      
      refreshDashboard();
    } catch (error) {
      console.error('Failed to save invoice:', error);
      showNotification(error.message || 'Impossibile salvare la fattura', 'error');
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
    const defaultTaxRate = window.AppState?.settings?.default_tax_rate || 22;
    
    this.shadowRoot.innerHTML = `
      <style>
        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: var(--color-overlay); z-index: 1000; justify-content: center; align-items: center; padding: 1rem; }
        .modal-content { background: var(--color-bg); color: var(--color-text-primary); border-radius: 0.375rem; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; border: 1px solid var(--color-border); box-shadow: var(--shadow-lg); }
        .modal-header { padding: 1.5rem; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; }
        .modal-title { font-size: 1.25rem; font-weight: 600; margin: 0; }
        .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--color-text-secondary); }
        .modal-body { padding: 1.5rem; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .form-group { margin-bottom: 1rem; }
        .form-group.full { grid-column: 1 / -1; }
        .form-label { display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 500; color: var(--color-text-secondary); }
        .form-input, .form-select, .form-textarea { width: 100%; padding: 0.5rem; border: 1px solid var(--color-border); border-radius: 0.375rem; font-size: 1rem; background: var(--color-bg); color: var(--color-text-primary); }
        .form-textarea { min-height: 80px; }
        .modal-footer { padding: 1.5rem; border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; gap: 1rem; }
        .btn { padding: 0.5rem 1.5rem; border: none; border-radius: 0.375rem; font-size: 1rem; font-weight: 500; cursor: pointer; }
        .btn-primary { background-color: var(--color-primary); color: white; }
        .btn-secondary { background-color: var(--color-bg-tertiary); color: var(--color-text-primary); }
      </style>
      
      <div class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">${this.invoice ? 'Modifica Fattura' : 'Nuova Fattura'}</h2>
            <button class="close-btn">×</button>
          </div>
          <div class="modal-body">
            <form id="invoice-form">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Numero Fattura *</label>
                  <input type="text" name="invoice_number" class="form-input" value="${this.invoice?.invoice_number || ''}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Stato</label>
                  <select name="status" class="form-select">
                    <option value="draft" ${this.invoice?.status === 'draft' ? 'selected' : ''}>Bozza</option>
                    <option value="sent" ${this.invoice?.status === 'sent' ? 'selected' : ''}>Inviata</option>
                    <option value="paid" ${!this.invoice || this.invoice.status === 'paid' ? 'selected' : ''}>Pagata</option>
                  </select>
                </div>
                <div class="form-group full">
                  <label class="form-label">Nome Cliente *</label>
                  <input type="text" name="client_name" class="form-input" value="${this.invoice?.client_name || ''}" required>
                </div>
                <div class="form-group full">
                  <label class="form-label">Descrizione</label>
                  <textarea name="description" class="form-textarea">${this.invoice?.description || ''}</textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">Importo *</label>
                  <input type="number" name="amount" class="form-input" value="${this.invoice?.amount || ''}" step="0.01" min="0" required>
                  <small style="display: block; margin-top: 0.25rem; font-size: 0.75rem; color: var(--color-text-secondary);">
                    Importo senza IVA (Regime Forfettario)
                  </small>
                </div>
                <div class="form-group">
                  <label class="form-label">Data Emissione *</label>
                  <input type="date" name="issue_date" class="form-input" value="${this.invoice?.issue_date ? formatDateForInput(this.invoice.issue_date) : getTodayDate()}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Data Scadenza *</label>
                  <input type="date" name="due_date" class="form-input" value="${this.invoice?.due_date ? formatDateForInput(this.invoice.due_date) : getTodayDate()}" required>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-action="cancel">Annulla</button>
            <button type="submit" form="invoice-form" class="btn btn-primary">Salva Fattura</button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('invoice-form', InvoiceForm);

