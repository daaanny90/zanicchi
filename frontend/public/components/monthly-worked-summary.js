class MonthlyWorkedSummary extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.summary = [];
    this.loading = false;
    this.error = null;
    const now = new Date();
    this.selectedYear = now.getFullYear();
    this.selectedMonth = now.getMonth() + 1;
    this.currencySymbol = window.AppState?.settings?.currency_symbol || '€';
    this.selectedClientId = 'all'; // 'all' or specific client ID
    this.handleMonthChange = this.handleMonthChange.bind(this);
    this.handleWorkedHoursUpdate = this.handleWorkedHoursUpdate.bind(this);
    this.handleClientsUpdate = this.handleClientsUpdate.bind(this);
  }

  connectedCallback() {
    window.addEventListener('monthly:monthChanged', this.handleMonthChange);
    window.addEventListener('worked-hours:updated', this.handleWorkedHoursUpdate);
    window.addEventListener('clients:updated', this.handleClientsUpdate);
    this.render();
    this.loadSummary();
  }

  disconnectedCallback() {
    window.removeEventListener('monthly:monthChanged', this.handleMonthChange);
    window.removeEventListener('worked-hours:updated', this.handleWorkedHoursUpdate);
    window.removeEventListener('clients:updated', this.handleClientsUpdate);
  }

  handleMonthChange(event) {
    const { year, month } = event.detail;
    this.selectedYear = year;
    this.selectedMonth = month;
    this.loadSummary();
  }

  handleWorkedHoursUpdate() {
    this.loadSummary();
  }

  handleClientsUpdate() {
    this.loadSummary();
  }

  async loadSummary() {
    this.loading = true;
    this.error = null;
    this.render();

    try {
      // apiRequest already unwraps data.data, so we get {summary: [...], overall: {...}} directly
      const data = await API.workedHours.getMonthlySummary(this.selectedYear, this.selectedMonth);
      console.log('Worked hours summary data:', data);
      
      this.summary = (data.summary || []).map(item => ({
        ...item,
        hours: typeof item.hours === 'number' ? item.hours : parseFloat(item.hours || '0'),
        amount: typeof item.amount === 'number' ? item.amount : parseFloat(item.amount || '0')
      }));
      this.overall = {
        total_hours: typeof data.overall?.total_hours === 'number'
          ? data.overall.total_hours
          : parseFloat(data.overall?.total_hours || '0'),
        total_amount: typeof data.overall?.total_amount === 'number'
          ? data.overall.total_amount
          : parseFloat(data.overall?.total_amount || '0')
      };
      this.loading = false;
      this.render();
    } catch (error) {
      console.error('Impossibile recuperare il riepilogo ore lavorate:', error);
      this.error = 'Impossibile caricare il riepilogo delle ore';
      this.loading = false;
      this.render();
    }
  }

  openLogHoursModal() {
    const workingDate = `${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}-01`;
    window.dispatchEvent(new CustomEvent('worked-hours:open-modal', {
      detail: { defaultDate: workingDate }
    }));
  }

  openClientsManager() {
    window.dispatchEvent(new CustomEvent('clients:open-manager'));
  }

  handleClientFilter(clientId) {
    this.selectedClientId = clientId;
    this.render();
  }

  getFilteredSummary() {
    if (this.selectedClientId === 'all') {
      return this.summary;
    }
    return this.summary.filter(item => item.client_id === parseInt(this.selectedClientId));
  }

  getFilteredTotals() {
    const filtered = this.getFilteredSummary();
    return {
      total_hours: filtered.reduce((sum, item) => sum + item.hours, 0),
      total_amount: filtered.reduce((sum, item) => sum + item.amount, 0)
    };
  }

  render() {
    const filteredSummary = this.getFilteredSummary();
    const filteredTotals = this.getFilteredTotals();
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-top: var(--space-xl);
          margin-bottom: var(--space-xl);
          color: var(--color-text-primary);
        }
        .card {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 0.125rem;
          padding: 1.5rem;
          box-shadow: var(--shadow-md);
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--color-text-primary);
        }
        .actions {
          display: flex;
          gap: 0.5rem;
        }
        .filter-row {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--color-border);
        }
        .filter-label {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--color-text-secondary);
        }
        select {
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--color-border);
          border-radius: 0.125rem;
          background: var(--color-bg);
          color: var(--color-text-primary);
          font-size: 0.9rem;
          cursor: pointer;
          transition: border-color var(--transition-fast);
        }
        select:hover {
          border-color: var(--color-primary);
        }
        select:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .btn {
          border-radius: 0.125rem;
          padding: 0.45rem 1rem;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid transparent;
          transition: background-color var(--transition-fast), border-color var(--transition-fast);
        }
        .btn-primary {
          background: var(--color-primary);
          color: #fff;
        }
        .btn-primary:hover {
          background: var(--color-primary-hover);
        }
        .btn-secondary {
          background: var(--color-bg-tertiary);
          color: var(--color-text-primary);
          border-color: var(--color-border);
        }
        .btn-secondary:hover {
          background: var(--color-bg-secondary);
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.95rem;
        }
        th, td {
          padding: 0.65rem 0.5rem;
          text-align: left;
          border-bottom: 1px solid var(--color-border);
        }
        th {
          font-size: 0.85rem;
          text-transform: uppercase;
          color: var(--color-text-secondary);
          letter-spacing: 0.04em;
        }
        tbody tr:hover {
          background: var(--color-bg-secondary);
        }
        .amount {
          font-weight: 600;
          color: var(--color-text-primary);
        }
        .summary-footer {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--color-border);
          display: flex;
          justify-content: space-between;
          font-weight: 600;
          color: var(--color-text-primary);
        }
        .filter-active {
          background: rgba(59, 130, 246, 0.1);
          padding: 0.5rem 0.75rem;
          border-radius: 0.125rem;
          font-size: 0.85rem;
          color: var(--color-primary);
        }
        .empty-state, .error {
          padding: 1rem;
          background: var(--color-bg-secondary);
          border-radius: 0;
          text-align: center;
          color: var(--color-text-secondary);
        }
        .error {
          background: rgba(239, 68, 68, 0.15);
          color: var(--color-danger);
        }
      </style>

      <div class="card">
        <div class="header">
          <h3>Ore Lavorate (${String(this.selectedMonth).padStart(2, '0')}/${this.selectedYear})</h3>
          <div class="actions">
            <button class="btn btn-secondary" id="manage-clients-btn">Gestisci Clienti</button>
            <button class="btn btn-primary" id="log-hours-btn">Registra Ore</button>
          </div>
        </div>

        ${this.loading ? `
          <div class="empty-state">Caricamento riepilogo...</div>
        ` : this.error ? `
          <div class="error">${this.error}</div>
        ` : this.summary.length === 0 ? `
          <div class="empty-state">
            Nessuna ora registrata per questo mese.
            <div style="margin-top:0.5rem;">Inizia cliccando "Registra Ore".</div>
          </div>
        ` : `
          <div class="filter-row">
            <span class="filter-label">Filtra per cliente:</span>
            <select id="client-filter">
              <option value="all" ${this.selectedClientId === 'all' ? 'selected' : ''}>Tutti i clienti</option>
              ${this.summary.map(item => `
                <option value="${item.client_id}" ${this.selectedClientId == item.client_id ? 'selected' : ''}>
                  ${item.client_name}
                </option>
              `).join('')}
            </select>
            ${this.selectedClientId !== 'all' ? `
              <span class="filter-active">
                ✓ Filtrato: ${filteredSummary[0]?.client_name || ''}
              </span>
            ` : ''}
          </div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th style="text-align:right;">Ore</th>
                  <th style="text-align:right;">Tariffa</th>
                  <th style="text-align:right;">Totale</th>
                </tr>
              </thead>
              <tbody>
                ${filteredSummary.map(item => `
                  <tr>
                    <td>${item.client_name}</td>
                    <td style="text-align:right;">${item.hours.toFixed(2)}</td>
                    <td style="text-align:right;">${this.currencySymbol}${(item.hours > 0 ? (item.amount / item.hours) : 0).toFixed(2)}</td>
                    <td style="text-align:right;" class="amount">${this.currencySymbol}${item.amount.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="summary-footer">
            <span>Totale ore: ${filteredTotals.total_hours.toFixed(2)}</span>
            <span>Totale importo: ${this.currencySymbol}${filteredTotals.total_amount.toFixed(2)}</span>
          </div>
        `}

      </div>
    `;

    const logBtn = this.shadowRoot.querySelector('#log-hours-btn');
    if (logBtn) logBtn.addEventListener('click', () => this.openLogHoursModal());

    const manageBtn = this.shadowRoot.querySelector('#manage-clients-btn');
    if (manageBtn) manageBtn.addEventListener('click', () => this.openClientsManager());

    const filterSelect = this.shadowRoot.querySelector('#client-filter');
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => this.handleClientFilter(e.target.value));
    }
  }
}

customElements.define('monthly-worked-summary', MonthlyWorkedSummary);

