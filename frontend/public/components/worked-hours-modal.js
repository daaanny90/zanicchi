class WorkedHoursModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.clients = [];
    this.isOpen = false;
    this.defaultDate = getTodayDate();
    this.loading = false;
    this.prefill = {};
    this.handleExternalOpen = this.handleExternalOpen.bind(this);
  }

  connectedCallback() {
    window.addEventListener('worked-hours:open-modal', this.handleExternalOpen);
    this.render();
    this.loadClients();
  }

  disconnectedCallback() {
    window.removeEventListener('worked-hours:open-modal', this.handleExternalOpen);
  }

  handleExternalOpen(event) {
    const detail = event?.detail || {};
    this.open(detail);
  }

  async loadClients() {
    try {
      const result = await API.clients.getAll();
      this.clients = result.map(client => ({
        ...client,
        hourly_rate: typeof client.hourly_rate === 'number'
          ? client.hourly_rate
          : parseFloat(client.hourly_rate || '0')
      }));
      this.render();
    } catch (error) {
      console.error('Impossibile caricare i clienti:', error);
      showNotification('Impossibile caricare i clienti', 'error');
    }
  }

  open(options = {}) {
    if (!this.clients.length) {
      this.loadClients();
    }
    this.defaultDate = options.defaultDate || getTodayDate();
    this.prefill = options.prefill || {};
    this.isOpen = true;
    this.render();
  }

  close() {
    this.isOpen = false;
    this.prefill = {};
    this.render();
  }

  async handleSubmit(event) {
    event.preventDefault();
    if (this.loading) return;

    const form = this.shadowRoot.querySelector('#worked-hours-form');
    const formData = new FormData(form);

    const clientId = formData.get('client_id');
    const workedDate = formData.get('worked_date');
    const hours = parseFloat(formData.get('hours'));
    const note = formData.get('note');

    if (!clientId) {
      showNotification('Seleziona un cliente', 'warning');
      return;
    }

    if (!workedDate) {
      showNotification('La data è obbligatoria', 'warning');
      return;
    }

    if (isNaN(hours) || hours <= 0) {
      showNotification('Le ore devono essere maggiori di zero', 'warning');
      return;
    }

    this.loading = true;
    this.render();

    try {
      await API.workedHours.create({
        client_id: parseInt(clientId),
        worked_date: workedDate,
        hours,
        note: note || ''
      });

      showNotification('Ore registrate con successo', 'success');
      window.dispatchEvent(new CustomEvent('worked-hours:updated'));
      this.close();
    } catch (error) {
      showNotification(error.message || 'Impossibile registrare le ore', 'error');
      console.error(error);
    } finally {
      this.loading = false;
      this.render();
    }
  }

  handleManageClients() {
    window.dispatchEvent(new CustomEvent('clients:open-manager'));
    this.close();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: relative;
        }
        .modal {
          position: fixed;
          inset: 0;
          display: ${this.isOpen ? 'flex' : 'none'};
          align-items: center;
          justify-content: center;
          background: var(--color-overlay);
          z-index: 2000;
          padding: 1rem;
        }
        .modal-content {
          width: 100%;
          max-width: 480px;
          background: var(--color-bg);
          color: var(--color-text-primary);
          border-radius: 0.75rem;
          box-shadow: var(--shadow-xl);
          overflow: hidden;
          border: 1px solid var(--color-border);
        }
        .modal-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--color-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header h2 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--color-text-primary);
        }
        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--color-text-secondary);
        }
        .modal-body {
          padding: 1.5rem;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        label {
          display: block;
          margin-bottom: 0.35rem;
          font-size: 0.9rem;
          font-weight: 500;
          color: #374151;
        }
        select,
        input,
        textarea {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--color-border);
          border-radius: 0.375rem;
          font-size: 1rem;
          font-family: inherit;
          background: var(--color-bg);
          color: var(--color-text-primary);
        }
        textarea {
          min-height: 80px;
          resize: vertical;
        }
        .modal-footer {
          padding: 1.25rem 1.5rem;
          border-top: 1px solid var(--color-border);
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }
        .btn {
          border: none;
          border-radius: 0.375rem;
          padding: 0.5rem 1.25rem;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
        }
        .btn-secondary {
          background: var(--color-bg-tertiary);
          color: var(--color-text-primary);
          border: 1px solid var(--color-border);
        }
        .btn-primary {
          background: var(--color-primary);
          color: #fff;
        }
        .empty-state {
          background: var(--color-bg-secondary);
          border: 1px dashed var(--color-border);
          padding: 1rem;
          border-radius: 0.5rem;
          text-align: center;
          font-size: 0.95rem;
          color: var(--color-text-secondary);
        }
        .empty-state button {
          margin-top: 0.75rem;
          padding: 0.4rem 1rem;
          border-radius: 999px;
          border: none;
          background: var(--color-primary);
          color: #fff;
          cursor: pointer;
        }
      </style>

      <div class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Registra Ore Lavorate</h2>
            <button class="close-btn" aria-label="Chiudi" id="close-modal">&times;</button>
          </div>
          <div class="modal-body">
            ${this.clients.length === 0 ? `
              <div class="empty-state">
                <p>Devi prima creare almeno un cliente.</p>
                <button type="button" id="manage-clients-btn">Gestisci Clienti</button>
              </div>
            ` : `
              <form id="worked-hours-form">
                <div class="form-group">
                  <label for="client_id">Cliente</label>
                  <select name="client_id" id="client_id" required>
                    <option value="">Seleziona cliente</option>
                    ${this.clients.map(client => `
                      <option value="${client.id}">${client.name} (${client.hourly_rate.toFixed(2)} €/h)</option>
                    `).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label for="worked_date">Data</label>
                  <input type="date" name="worked_date" id="worked_date" value="${this.prefill.worked_date || this.defaultDate}" required>
                </div>
                <div class="form-group">
                  <label for="hours">Ore Lavorate</label>
                  <input type="number" step="0.25" min="0.25" name="hours" id="hours" value="${this.prefill.hours || ''}" placeholder="es. 2,5" required>
                </div>
                <div class="form-group">
                  <label for="note">Nota (opzionale)</label>
                  <textarea name="note" id="note" placeholder="Descrizione attività...">${this.prefill.note || ''}</textarea>
                </div>
              </form>
            `}
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="cancel-btn">Annulla</button>
            ${this.clients.length ? `<button class="btn btn-primary" id="save-btn" ${this.loading ? 'disabled' : ''}>${this.loading ? 'Salvataggio...' : 'Salva'}</button>` : ''}
          </div>
        </div>
      </div>
    `;

    const closeBtn = this.shadowRoot.querySelector('#close-modal');
    const cancelBtn = this.shadowRoot.querySelector('#cancel-btn');
    const saveBtn = this.shadowRoot.querySelector('#save-btn');
    const manageBtn = this.shadowRoot.querySelector('#manage-clients-btn');

    if (closeBtn) closeBtn.addEventListener('click', () => this.close());
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.close());
    if (saveBtn) saveBtn.addEventListener('click', (e) => this.handleSubmit(e));
    if (manageBtn) manageBtn.addEventListener('click', () => this.handleManageClients());
  }
}

customElements.define('worked-hours-modal', WorkedHoursModal);

