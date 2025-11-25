/**
 * Expense Form Component
 * 
 * Custom Web Component for creating and editing expenses.
 * Modal form with category selection.
 * 
 * Usage:
 * <expense-form></expense-form>
 */

class ExpenseForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.expense = null;
  }
  
  connectedCallback() {
    this.render();
  }
  
  show(expense = null) {
    this.expense = expense;
    this.render();
    this.shadowRoot.querySelector('.modal').style.display = 'flex';
    this.attachEventListeners();
  }
  
  hide() {
    this.shadowRoot.querySelector('.modal').style.display = 'none';
    this.expense = null;
  }
  
  async submitForm(e) {
    e.preventDefault();
    
    const form = this.shadowRoot.querySelector('#expense-form');
    const formData = new FormData(form);
    
    const data = {
      description: formData.get('description'),
      amount: parseFloat(formData.get('amount')),
      category_id: parseInt(formData.get('category_id')),
      expense_date: formData.get('expense_date'),
      notes: formData.get('notes')
    };
    
    try {
      if (this.expense) {
        await API.expenses.update(this.expense.id, data);
        showNotification('Spesa aggiornata con successo', 'success');
      } else {
        await API.expenses.create(data);
        showNotification('Spesa creata con successo', 'success');
      }
      
      this.hide();
      
      const list = document.querySelector('expense-list');
      if (list && list.loadExpenses) {
        list.loadExpenses();
      }
      
      refreshDashboard();
    } catch (error) {
      console.error('Failed to save expense:', error);
      showNotification(error.message || 'Impossibile salvare la spesa', 'error');
    }
  }
  
  attachEventListeners() {
    const form = this.shadowRoot.querySelector('#expense-form');
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
    const categories = window.AppState?.categories || [];
    
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
            <h2 class="modal-title">${this.expense ? 'Modifica Spesa' : 'Nuova Spesa'}</h2>
            <button class="close-btn">×</button>
          </div>
          <div class="modal-body">
            <form id="expense-form">
              <div class="form-grid">
                <div class="form-group full">
                  <label class="form-label">Descrizione *</label>
                  <input type="text" name="description" class="form-input" value="${this.expense?.description || ''}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Importo *</label>
                  <input type="number" name="amount" class="form-input" value="${this.expense?.amount || ''}" step="0.01" min="0" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Categoria *</label>
                  <select name="category_id" class="form-select" required>
                    <option value="">Seleziona categoria...</option>
                    ${categories.filter(c => c.type === 'expense').map(cat => `
                      <option value="${cat.id}" ${this.expense?.category_id === cat.id ? 'selected' : ''}>
                        ${cat.name}
                      </option>
                    `).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Data *</label>
                  <input type="date" name="expense_date" class="form-input" value="${this.expense?.expense_date ? formatDateForInput(this.expense.expense_date) : getTodayDate()}" required>
                </div>
                <div class="form-group full">
                  <label class="form-label">Note</label>
                  <textarea name="notes" class="form-textarea">${this.expense?.notes || ''}</textarea>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-action="cancel">Annulla</button>
            <button type="submit" form="expense-form" class="btn btn-primary">Salva Spesa</button>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('expense-form', ExpenseForm);

