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
    this.clientReport = null;
    this.reportLoading = false;
    this.reportError = null;
    this.downloadingPdf = false;
    this.reportRequestId = 0;
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
    this.reportRequestId++;
    this.clientReport = null;
    this.reportError = null;
    this.loadSummary();
    if (this.selectedClientId !== 'all') {
      this.loadClientReportDetails();
    } else {
      this.render();
    }
  }

  handleWorkedHoursUpdate() {
    this.reportRequestId++;
    this.clientReport = null;
    this.reportError = null;
    this.loadSummary();
    if (this.selectedClientId !== 'all') {
      this.loadClientReportDetails();
    } else {
      this.render();
    }
  }

  handleClientsUpdate() {
    this.reportRequestId++;
    this.clientReport = null;
    this.reportError = null;
    this.loadSummary();
    if (this.selectedClientId !== 'all') {
      this.loadClientReportDetails();
    } else {
      this.render();
    }
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

      if (this.selectedClientId !== 'all') {
        const hasClient = this.summary.some(
          (item) => item.client_id === parseInt(this.selectedClientId, 10)
        );
        if (!hasClient) {
          this.selectedClientId = 'all';
          this.clientReport = null;
          this.reportError = null;
          this.reportRequestId++;
        }
      }
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
    this.reportRequestId++;
    this.selectedClientId = clientId;
    this.clientReport = null;
    this.reportError = null;
    this.render();
    if (clientId !== 'all') {
      this.loadClientReportDetails();
    }
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

  async loadClientReportDetails() {
    const clientIdNum = parseInt(this.selectedClientId, 10);
    if (isNaN(clientIdNum)) {
      return;
    }

    const requestId = ++this.reportRequestId;
    this.reportLoading = true;
    this.reportError = null;
    this.clientReport = null;
    this.render();

    try {
      const data = await API.workedHours.getMonthlyReportDetails(
        this.selectedYear,
        this.selectedMonth,
        clientIdNum
      );
      if (requestId === this.reportRequestId) {
        const entries = Array.isArray(data.entries)
          ? data.entries.map((entry) => ({
              ...entry,
              hours: typeof entry.hours === 'number' ? entry.hours : parseFloat(entry.hours || '0'),
              amount: typeof entry.amount === 'number' ? entry.amount : parseFloat(entry.amount || '0')
            }))
          : [];

        const groupedEntries = Array.isArray(data.grouped_entries) && data.grouped_entries.length
          ? data.grouped_entries
          : this.buildGroupedEntries(entries);

        this.clientReport = {
          ...data,
          entries,
          grouped_entries: groupedEntries
        };
      }
    } catch (error) {
      console.error('Impossibile recuperare il dettaglio ore lavorate:', error);
      if (requestId === this.reportRequestId) {
        this.reportError = 'Impossibile caricare il dettaglio per questo cliente.';
      }
    } finally {
      if (requestId === this.reportRequestId) {
        this.reportLoading = false;
        this.render();
      }
    }
  }

  async downloadReportPdf() {
    if (this.selectedClientId === 'all' || this.downloadingPdf) {
      return;
    }
    const clientIdNum = parseInt(this.selectedClientId, 10);
    if (isNaN(clientIdNum)) {
      return;
    }

    this.reportError = null;
    this.downloadingPdf = true;
    this.render();

    try {
      const blob = await API.workedHours.downloadMonthlyReportPdf(
        this.selectedYear,
        this.selectedMonth,
        clientIdNum
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const clientName =
        this.clientReport?.client?.name || this.getFilteredSummary()[0]?.client_name || 'cliente';
      const safeClient = clientName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      link.href = url;
      link.download = `report-ore-${safeClient || 'cliente'}-${String(this.selectedMonth).padStart(2, '0')}-${this.selectedYear}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Errore durante il download del report PDF:', error);
      this.reportError = 'Impossibile generare il PDF. Riprova più tardi.';
    } finally {
      this.downloadingPdf = false;
      this.render();
    }
  }

  getReportEntryById(entryId) {
    if (!this.clientReport || !this.clientReport.entries) return null;
    return this.clientReport.entries.find((entry) => entry.id === entryId) || null;
  }

  openEditEntry(entryId) {
    const entry = this.getReportEntryById(entryId);
    if (!entry || !this.clientReport?.client) {
      return;
    }

    window.dispatchEvent(new CustomEvent('worked-hours:open-modal', {
      detail: {
        mode: 'edit',
        defaultDate: entry.worked_date,
        prefill: {
          id: entry.id,
          client_id: this.clientReport.client.id,
          worked_date: entry.worked_date,
          hours: entry.hours,
          note: entry.note || ''
        }
      }
    }));
  }

  async deleteReportEntry(entryId) {
    const entry = this.getReportEntryById(entryId);
    if (!entry) {
      return;
    }

    const confirmed = window.confirm('Sei sicuro di voler eliminare questa registrazione di ore?');
    if (!confirmed) return;

    try {
      await API.workedHours.delete(entryId);
      showNotification('Registrazione eliminata', 'success');
      window.dispatchEvent(new CustomEvent('worked-hours:updated'));
    } catch (error) {
      console.error('Errore durante l\'eliminazione delle ore:', error);
      showNotification('Impossibile eliminare il record', 'error');
    }
  }

  escapeHtml(value) {
    if (!value) return '';
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  formatDate(value) {
    if (!value) return '';
    const normalized = value.includes('T') ? value : `${value}T00:00:00`;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatDateShort(value) {
    if (!value) return '';
    const normalized = value.includes('T') ? value : `${value}T00:00:00`;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  }

  buildGroupedEntries(entries = []) {
    const groups = new Map();
    entries.forEach((entry) => {
      const key = entry.worked_date;
      if (!groups.has(key)) {
        groups.set(key, {
          worked_date: key,
          hours: 0,
          amount: 0,
          notes: [],
          records: []
        });
      }

      const group = groups.get(key);
      const hours = typeof entry.hours === 'number' ? entry.hours : parseFloat(entry.hours || '0');
      const amount = typeof entry.amount === 'number' ? entry.amount : parseFloat(entry.amount || '0');
      group.hours += hours;
      group.amount += amount;
      if (entry.note && entry.note.trim().length) {
        group.notes.push(entry.note.trim());
      }
      group.records.push(entry);
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        hours: parseFloat(group.hours.toFixed(2)),
        amount: parseFloat(group.amount.toFixed(2))
      }))
      .sort((a, b) => (a.worked_date < b.worked_date ? -1 : 1));
  }

  getGroupedReportEntries() {
    if (!this.clientReport) return [];
    if (Array.isArray(this.clientReport.grouped_entries) && this.clientReport.grouped_entries.length) {
      return this.clientReport.grouped_entries;
    }
    const grouped = this.buildGroupedEntries(this.clientReport.entries || []);
    this.clientReport.grouped_entries = grouped;
    return grouped;
  }

  renderClientReportSection() {
    if (this.selectedClientId === 'all') {
      return '';
    }

    if (this.reportLoading) {
      return `
        <div class="report-panel">
          <div class="empty-state">Caricamento dettaglio...</div>
        </div>
      `;
    }

    if (this.reportError) {
      return `
        <div class="report-panel">
          <div class="error">${this.reportError}</div>
        </div>
      `;
    }

    if (!this.clientReport) {
      return `
        <div class="report-panel">
          <div class="empty-state">Seleziona un cliente per generare il report dettagliato.</div>
        </div>
      `;
    }

    const periodLabel = this.clientReport.period.label;
    const formattedPeriodLabel =
      periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1);

    const groupedEntries = this.getGroupedReportEntries();

    const entriesHtml = groupedEntries.length
      ? groupedEntries
          .map((group) => this.renderGroupedEntry(group))
          .join('')
      : `<div class="empty-state">Non ci sono ore registrate per questo cliente nel periodo selezionato.</div>`;

    return `
      <div class="report-panel">
        <div class="report-panel-header">
          <div>
            <div class="report-title">${this.clientReport.client.name}</div>
            <div class="report-subtitle">${formattedPeriodLabel}</div>
          </div>
          <button class="btn btn-primary report-download-btn" data-download-report ${this.downloadingPdf ? 'disabled' : ''}>
            ${this.downloadingPdf ? 'Generazione...' : 'Genera report PDF'}
          </button>
        </div>
        <div class="report-list">
          ${entriesHtml}
        </div>
        <div class="report-summary">
          <span>Totale ore: ${this.clientReport.totals.hours.toFixed(2)}</span>
          <span>Totale importo: ${this.currencySymbol}${this.clientReport.totals.amount.toFixed(2)}</span>
        </div>
      </div>
    `;
  }

  renderGroupedEntry(group) {
    const recordsHtml = group.records
      .map((record) => this.renderGroupedRecord(record))
      .join('');
    return `
      <div class="report-row">
        <div class="report-row-header">
          <div class="report-row-main">
            <span class="report-date">${this.formatDateShort(group.worked_date)}</span>
            <span class="report-hours">${group.hours.toFixed(2)} h</span>
            <span class="report-amount">${this.currencySymbol}${group.amount.toFixed(2)}</span>
          </div>
        </div>
        <div class="group-records">
          ${recordsHtml}
        </div>
      </div>
    `;
  }

  renderGroupedRecord(record) {
    const note = record.note
      ? this.escapeHtml(record.note).replace(/\n/g, '<br>')
      : '<span class="report-note-empty">Nessuna descrizione</span>';
    return `
      <div class="group-record">
        <div class="group-record-info">
          <span class="group-record-meta">${record.hours.toFixed(2)} h · ${this.currencySymbol}${record.amount.toFixed(
            2
          )}</span>
          <div class="group-record-note">${note}</div>
        </div>
        <div class="group-record-actions">
          <button class="report-action-btn" data-edit-entry="${record.id}">Modifica</button>
          <button class="report-action-btn danger" data-delete-entry="${record.id}">Elimina</button>
        </div>
      </div>
    `;
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
          border-radius: 0.375rem;
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
          flex-wrap: wrap;
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
          border-radius: 0.375rem;
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
          border-radius: 0.375rem;
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
          border-radius: 0.375rem;
          font-size: 0.85rem;
          color: var(--color-primary);
        }
        .empty-state, .error {
          padding: 1rem;
          background: var(--color-bg-secondary);
          border-radius: 0.25rem;
          text-align: center;
          color: var(--color-text-secondary);
        }
        .error {
          background: rgba(239, 68, 68, 0.15);
          color: var(--color-danger);
        }
        .report-panel {
          margin-top: 1.5rem;
          padding: 1rem;
          border: 1px solid var(--color-border);
          border-radius: 0.375rem;
          background: var(--color-bg-secondary);
        }
        .report-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .report-title {
          font-weight: 600;
          font-size: 1rem;
        }
        .report-subtitle {
          font-size: 0.85rem;
          color: var(--color-text-secondary);
        }
        .report-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .report-row {
          padding: 0.75rem;
          border-radius: 0.375rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
        }
        .report-row-header {
          display: flex;
          justify-content: space-between;
          gap: 0.75rem;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--color-text-primary);
          flex-wrap: wrap;
        }
        .report-row-main {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          align-items: center;
        }
        .report-date {
          font-weight: 600;
        }
        .report-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        .report-action-btn {
          border: none;
          background: none;
          color: var(--color-primary);
          cursor: pointer;
          font-size: 0.85rem;
          padding: 0.15rem 0.35rem;
        }
        .report-action-btn.danger {
          color: var(--color-danger);
        }
        .report-note {
          margin-top: 0.35rem;
          font-size: 0.9rem;
          color: var(--color-text-secondary);
          line-height: 1.4;
        }
        .group-records {
          margin-top: 0.75rem;
          border-top: 1px solid var(--color-border);
        }
        .group-record {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 0.75rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--color-border);
        }
        .group-record:last-child {
          border-bottom: none;
        }
        .group-record-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .group-record-note {
          font-size: 0.9rem;
          color: var(--color-text-secondary);
          line-height: 1.4;
        }
        .group-record-meta {
          font-weight: 600;
          color: var(--color-text-primary);
          font-size: 0.9rem;
        }
        .group-record-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
          align-items: flex-start;
        }
        .report-row-header .report-hours,
        .report-row-header .report-amount {
          font-weight: 600;
        }
        .report-note-empty {
          font-style: italic;
          color: var(--color-text-tertiary, #888);
        }
        .report-summary {
          margin-top: 1rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--color-border);
          display: flex;
          justify-content: space-between;
          font-weight: 600;
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

        ${this.renderClientReportSection()}

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

    const downloadButtons = this.shadowRoot.querySelectorAll('[data-download-report]');
    downloadButtons.forEach((btn) => {
      btn.addEventListener('click', () => this.downloadReportPdf());
    });

    const editButtons = this.shadowRoot.querySelectorAll('[data-edit-entry]');
    editButtons.forEach((btn) => {
      btn.addEventListener('click', (event) => {
        const entryId = parseInt(event.currentTarget.getAttribute('data-edit-entry'), 10);
        if (!isNaN(entryId)) {
          this.openEditEntry(entryId);
        }
      });
    });

    const deleteButtons = this.shadowRoot.querySelectorAll('[data-delete-entry]');
    deleteButtons.forEach((btn) => {
      btn.addEventListener('click', (event) => {
        const entryId = parseInt(event.currentTarget.getAttribute('data-delete-entry'), 10);
        if (!isNaN(entryId)) {
          this.deleteReportEntry(entryId);
        }
      });
    });
  }
}

customElements.define('monthly-worked-summary', MonthlyWorkedSummary);

