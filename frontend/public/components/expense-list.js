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
      showNotification('Failed to load expenses', 'error');
    }
  }
  
  async deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }
    
    try {
      await API.expenses.delete(id);
      showNotification('Expense deleted successfully', 'success');
      this.loadExpenses();
      refreshDashboard();
    } catch (error) {
      console.error('Failed to delete expense:', error);
      showNotification('Failed to delete expense', 'error');
    }
  }
  
  editExpense(expense) {
    const form = document.querySelector('expense-form');
    if (form) {
      form.show(expense);
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
        .category-badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.75rem; border-radius: 9999px; background-color: #f3f4f6; font-size: 0.75rem; }
        .category-color { width: 12px; height: 12px; border-radius: 50%; }
        .actions { display: flex; gap: 0.5rem; }
        .btn { padding: 0.25rem 0.75rem; font-size: 0.75rem; border: none; border-radius: 0.375rem; cursor: pointer; }
        .btn-primary { background-color: #2563eb; color: white; }
        .btn-danger { background-color: #ef4444; color: white; }
        .empty { text-align: center; padding: 3rem; color: #6b7280; }
      </style>
      
      ${this.expenses.length > 0 ? this.renderTable(currency) : '<div class="empty">No expenses yet. Click "New Expense" to create one.</div>'}
    `;
    
    this.attachEventListeners();
  }
  
  renderTable(currency) {
    return `
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.expenses.map(exp => `
              <tr>
                <td>${exp.description}</td>
                <td>
                  <span class="category-badge">
                    <span class="category-color" style="background-color: ${exp.category_color}"></span>
                    ${exp.category_name}
                  </span>
                </td>
                <td>${formatCurrency(exp.amount, currency)}</td>
                <td>${formatDate(exp.expense_date, 'short')}</td>
                <td>
                  <div class="actions">
                    <button class="btn btn-primary" data-action="edit" data-id="${exp.id}">Edit</button>
                    <button class="btn btn-danger" data-action="delete" data-id="${exp.id}">Delete</button>
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

