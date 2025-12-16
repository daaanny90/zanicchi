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
    this.filters = {
      categoryId: null,
      startDate: null,
      endDate: null
    };
  }
  
  connectedCallback() {
    this.render();
    this.loadExpenses();
    
    // Listen for data changes to auto-refresh
    this.boundReload = () => this.loadExpenses();
    window.addEventListener(window.AppEvents?.EXPENSES_CHANGED || 'data:expenses:changed', this.boundReload);
  }
  
  disconnectedCallback() {
    // Clean up event listener
    if (this.boundReload) {
      window.removeEventListener(window.AppEvents?.EXPENSES_CHANGED || 'data:expenses:changed', this.boundReload);
    }
  }
  
  async loadExpenses() {
    try {
      // Build filters object
      const filters = {};
      if (this.filters.categoryId) {
        filters.categoryId = this.filters.categoryId;
      }
      if (this.filters.startDate) {
        filters.startDate = this.filters.startDate;
      }
      if (this.filters.endDate) {
        filters.endDate = this.filters.endDate;
      }
      
      this.expenses = await API.expenses.getAll(filters);
      this.render();
    } catch (error) {
      console.error('Failed to load expenses:', error);
      showNotification('Impossibile caricare le spese', 'error');
    }
  }
  
  applyFilters() {
    const categorySelect = this.shadowRoot.querySelector('#filter-category');
    const startDateInput = this.shadowRoot.querySelector('#filter-start-date');
    const endDateInput = this.shadowRoot.querySelector('#filter-end-date');
    
    this.filters.categoryId = categorySelect?.value || null;
    this.filters.startDate = startDateInput?.value || null;
    this.filters.endDate = endDateInput?.value || null;
    
    this.loadExpenses();
  }
  
  clearFilters() {
    this.filters = {
      categoryId: null,
      startDate: null,
      endDate: null
    };
    this.loadExpenses();
  }
  
  async deleteExpense(id) {
    if (!confirm('Sei sicuro di voler eliminare questa spesa?')) {
      return;
    }
    
    try {
      await API.expenses.delete(id);
      showNotification('Spesa eliminata con successo', 'success');
      // Emit event instead of manual reload
      window.emitDataChange?.(window.AppEvents?.EXPENSES_CHANGED || 'data:expenses:changed');
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
  
  calculateTotal() {
    return this.expenses.reduce((sum, exp) => {
      const amount = parseFloat(exp.amount) || 0;
      const ivaAmount = parseFloat(exp.iva_amount) || 0;
      return sum + amount + ivaAmount;
    }, 0);
  }
  
  render() {
    const settings = window.AppState?.settings;
    const currency = settings?.currency || 'EUR';
    const categories = window.AppState?.categories || [];
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
          background-color: var(--color-danger);
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
        .category-badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.75rem; border-radius: 9999px; background-color: var(--color-bg-tertiary); font-size: 0.75rem; }
        .category-color { width: 12px; height: 12px; border-radius: 50%; }
        .actions { display: flex; gap: 0.5rem; }
        .btn { padding: 0.5rem 1rem; font-size: 0.875rem; border: none; border-radius: 0.375rem; cursor: pointer; transition: opacity 0.2s; }
        .btn:hover { opacity: 0.9; }
        .btn-primary { background-color: var(--color-primary); color: white; }
        .btn-secondary { background-color: var(--color-bg-tertiary); color: var(--color-text-primary); }
        .btn-danger { background-color: var(--color-danger); color: white; }
        .btn-sm { padding: 0.25rem 0.75rem; font-size: 0.75rem; }
        .empty { text-align: center; padding: 3rem; color: var(--color-text-secondary); }
      </style>
      
      <div class="filters-bar">
        <div class="filter-group">
          <label for="filter-category">Categoria</label>
          <select id="filter-category">
            <option value="">Tutte le categorie</option>
            ${categories.map(cat => `
              <option value="${cat.id}" ${this.filters.categoryId == cat.id ? 'selected' : ''}>
                ${cat.name}
              </option>
            `).join('')}
          </select>
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
      
      ${this.expenses.length > 0 ? `
        <div class="total-banner">
          <span class="total-label">Totale Spese (${this.expenses.length})</span>
          <span class="total-amount">${formatCurrency(total, currency)}</span>
        </div>
        ${this.renderTable(currency)}
      ` : '<div class="empty">Nessuna spesa trovata con questi filtri.</div>'}
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
              // Convert strings to numbers for calculation
              const amount = parseFloat(exp.amount) || 0;
              const ivaAmount = parseFloat(exp.iva_amount) || 0;
              const total = amount + ivaAmount;
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
                  <td>${formatCurrency(amount, currency)}</td>
                  <td>${ivaDisplay}</td>
                  <td><strong>${formatCurrency(total, currency)}</strong></td>
                  <td>${formatDate(exp.expense_date, 'short')}</td>
                  <td>
                    <div class="actions">
                      <button class="btn btn-primary btn-sm" data-action="edit" data-id="${exp.id}">Modifica</button>
                      <button class="btn btn-danger btn-sm" data-action="delete" data-id="${exp.id}">Elimina</button>
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

