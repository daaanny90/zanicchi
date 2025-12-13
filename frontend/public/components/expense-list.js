/**
 * Expense List Component
 * 
 * Custom Web Component that displays a table of all expenses.
 * 
 * Usage:
 * <expense-list></expense-list>
 */

class ExpenseList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.expenses = [];
  }
  
  connectedCallback() {
    this.render();
    this.loadExpenses();
  }
  
  async loadExpenses() {
    try {
      this.expenses = await API.expenses.getAll();
      this.render();
    } catch (error) {
      console.error('Failed to load expenses:', error);
      showNotification('Impossibile caricare le spese', 'error');
    }
  }
  
  async deleteExpense(id) {
    if (!confirm('Sei sicuro di voler eliminare questa spesa?')) {
      return;
    }
    
    try {
      await API.expenses.delete(id);
      showNotification('Spesa eliminata con successo', 'success');
      this.loadExpenses();
      refreshDashboard();
    } catch (error) {
      console.error('Failed to delete expense:', error);
      showNotification('Impossibile eliminare la spesa', 'error');
    }
  }
  
  editExpense(expense) {
    const form = document.querySelector('expense-form');
    if (form) {
      form.show(expense);
    }
  }
  
  render() {
    const settings = window.AppState?.settings;
    const currency = settings?.currency || 'EUR';
    
    this.shadowRoot.innerHTML = `
      <style>
        :host { 
          display: block;
          margin-top: var(--space-lg);
        }
        .table-container { overflow-x: auto; border-radius: 0.375rem; border: 1px solid var(--color-border); }
        .table { width: 100%; border-collapse: collapse; background-color: var(--color-bg); }
        .table thead { background-color: var(--color-bg-tertiary); border-bottom: 2px solid var(--color-border); }
        .table th { padding: 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; }
        .table td { padding: 1rem; border-bottom: 1px solid var(--color-border); font-size: 0.875rem; color: var(--color-text-primary); }
        .table tbody tr:hover { background-color: var(--color-bg-secondary); }
        .table tbody tr:last-child td { border-bottom: none; }
        .category-badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.75rem; border-radius: 9999px; background-color: var(--color-bg-tertiary); font-size: 0.75rem; }
        .category-color { width: 12px; height: 12px; border-radius: 50%; }
        .actions { display: flex; gap: 0.5rem; }
        .btn { padding: 0.25rem 0.75rem; font-size: 0.75rem; border: none; border-radius: 0.375rem; cursor: pointer; }
        .btn-primary { background-color: var(--color-primary); color: white; }
        .btn-danger { background-color: var(--color-danger); color: white; }
        .empty { text-align: center; padding: 3rem; color: var(--color-text-secondary); }
      </style>
      
      ${this.expenses.length > 0 ? this.renderTable(currency) : '<div class="empty">Nessuna spesa ancora. Clicca "Nuova Spesa" per crearne una.</div>'}
    `;
    
    this.attachEventListeners();
  }
  
  renderTable(currency) {
    return `
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Descrizione</th>
              <th>Categoria</th>
              <th>Importo Netto</th>
              <th>IVA</th>
              <th>Totale</th>
              <th>Data</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            ${this.expenses.map(exp => {
              const ivaAmount = exp.iva_amount || 0;
              const total = exp.amount + ivaAmount;
              const ivaDisplay = exp.iva_included 
                ? '<span style="color: var(--color-text-secondary); font-size: 0.75rem;">Inclusa</span>'
                : `${formatCurrency(ivaAmount, currency)}<br><small style="color: var(--color-text-secondary); font-size: 0.65rem;">${exp.iva_rate}%</small>`;
              
              return `
                <tr>
                  <td>${exp.description}</td>
                  <td>
                    <span class="category-badge">
                      <span class="category-color" style="background-color: ${exp.category_color}"></span>
                      ${exp.category_name}
                    </span>
                  </td>
                  <td>${formatCurrency(exp.amount, currency)}</td>
                  <td>${ivaDisplay}</td>
                  <td><strong>${formatCurrency(total, currency)}</strong></td>
                  <td>${formatDate(exp.expense_date, 'short')}</td>
                  <td>
                    <div class="actions">
                      <button class="btn btn-primary" data-action="edit" data-id="${exp.id}">Modifica</button>
                      <button class="btn btn-danger" data-action="delete" data-id="${exp.id}">Elimina</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  
  attachEventListeners() {
    this.shadowRoot.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const id = parseInt(btn.dataset.id);
        const expense = this.expenses.find(exp => exp.id === id);
        
        if (action === 'edit' && expense) {
          this.editExpense(expense);
        } else if (action === 'delete') {
          this.deleteExpense(id);
        }
      });
    });
  }
}

customElements.define('expense-list', ExpenseList);

