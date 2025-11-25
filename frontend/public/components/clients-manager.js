class ClientsManager extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.clients = [];
    this.isOpen = false;
    this.editingClient = null;
    this.loading = false;
    this.handleExternalOpen = this.handleExternalOpen.bind(this);
  }

  connectedCallback() {
    window.addEventListener('clients:open-manager', this.handleExternalOpen);
    this.render();
    this.loadClients();
  }

  disconnectedCallback() {
    window.removeEventListener('clients:open-manager', this.handleExternalOpen);
  }

  handleExternalOpen() {
    this.open();
  }

  async loadClients() {
    try {
      const result = await API.clients.getAll();
      this.clients = result.map((client) => ({
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

  open() {
    this.isOpen = true;
    this.render();
  }

  close() {
    this.isOpen = false;
    this.editingClient = null;
    this.render();
  }

  startEdit(clientId) {
    this.editingClient = this.clients.find((client) => client.id === clientId) || null;
    this.render();
  }

  cancelEdit() {
    this.editingClient = null;
    this.render();
  }

  async handleSubmit(event) {
    event.preventDefault();
    if (this.loading) return;

    const form = this.shadowRoot.querySelector('#client-form');
    const formData = new FormData(form);

    const name = formData.get('name').trim();
    const hourlyRate = parseFloat(formData.get('hourly_rate'));
    const notes = formData.get('notes');

    if (!name) {
      showNotification('Il nome è obbligatorio', 'warning');
      return;
    }

    if (isNaN(hourlyRate) || hourlyRate <= 0) {
      showNotification('La tariffa oraria deve essere maggiore di zero', 'warning');
      return;
    }

    this.loading = true;
    this.render();

    try {
      if (this.editingClient) {
        await API.clients.update(this.editingClient.id, {
          name,
          hourly_rate: hourlyRate,
          notes
        });
        showNotification('Cliente aggiornato', 'success');
      } else {
        await API.clients.create({
          name,
          hourly_rate: hourlyRate,
          notes
        });
        showNotification('Cliente creato', 'success');
      }

      window.dispatchEvent(new CustomEvent('clients:updated'));
      await this.loadClients();
      this.editingClient = null;
      form.reset();
    } catch (error) {
      console.error('Errore salvataggio cliente:', error);
      showNotification(error.message || 'Errore durante il salvataggio', 'error');
    } finally {
      this.loading = false;
      this.render();
    }
  }

  async handleDelete(clientId) {
    if (!confirm('Sei sicuro di voler eliminare questo cliente?')) {
      return;
    }

    try {
      await API.clients.delete(clientId);
      showNotification('Cliente eliminato', 'success');
      window.dispatchEvent(new CustomEvent('clients:updated'));
      this.loadClients();
    } catch (error) {
      console.error(error);
      showNotification(error.message || 'Impossibile eliminare il cliente', 'error');
    }
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
          background: rgba(15, 23, 42, 0.45);
          z-index: 2100;
          padding: 1rem;
        }
        .modal-content {
          width: 100%;
          max-width: 720px;
          background: #fff;
          border-radius: 0.75rem;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .modal-header,
        .modal-footer {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-footer {
          border-top: 1px solid #e5e7eb;
          border-bottom: none;
          justify-content: flex-end;
        }
        .modal-header h2 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
        }
        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
        }
        .modal-body {
          padding: 1.5rem;
          max-height: 70vh;
          overflow-y: auto;
          display: grid;
          gap: 1.5rem;
        }
        form {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }
        .form-group {
          display: flex;
          flex-direction: column;
        }
        label {
          font-size: 0.9rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.35rem;
        }
        input,
        textarea {
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          padding: 0.5rem 0.75rem;
          font-size: 1rem;
        }
        textarea {
          min-height: 80px;
          grid-column: 1 / -1;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 0.65rem;
          border-bottom: 1px solid #e5e7eb;
          text-align: left;
          font-size: 0.95rem;
        }
        th {
          background: #f8fafc;
          font-weight: 600;
          color: #1f2937;
        }
        td .actions {
          display: flex;
          gap: 0.5rem;
        }
        .btn {
          border: none;
          border-radius: 0.375rem;
          padding: 0.4rem 0.95rem;
          font-size: 0.9rem;
          cursor: pointer;
        }
        .btn-primary {
          background: #2563eb;
          color: #fff;
        }
        .btn-danger {
          background: #ef4444;
          color: #fff;
        }
        .btn-outline {
          background: transparent;
          border: 1px solid #d1d5db;
          color: #374151;
        }
        .list-empty {
          text-align: center;
          padding: 1rem;
          color: #6b7280;
          font-style: italic;
        }
      </style>

      <div class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Gestione Clienti</h2>
            <button class="close-btn" id="close-manager">&times;</button>
          </div>
          <div class="modal-body">
            <section>
              <h3 style="margin:0 0 0.75rem 0;font-size:1rem;color:#1f2937;">${this.editingClient ? 'Modifica Cliente' : 'Nuovo Cliente'}</h3>
              <form id="client-form">
                <div class="form-group">
                  <label>Nome</label>
                  <input type="text" name="name" value="${this.editingClient?.name || ''}" placeholder="Nome cliente" required>
                </div>
                <div class="form-group">
                  <label>Tariffa Oraria (€)</label>
                  <input type="number" name="hourly_rate" min="1" step="0.5" value="${this.editingClient?.hourly_rate || ''}" placeholder="es. 80" required>
                </div>
                <div class="form-group" style="grid-column:1 / -1;">
                  <label>Note</label>
                  <textarea name="notes" placeholder="Informazioni aggiuntive...">${this.editingClient?.notes || ''}</textarea>
                </div>
              </form>
              <div style="display:flex; gap:0.75rem; margin-top:0.5rem;">
                <button class="btn btn-primary" id="save-client" ${this.loading ? 'disabled' : ''}>${this.loading ? 'Salvataggio...' : this.editingClient ? 'Aggiorna' : 'Aggiungi'}</button>
                ${this.editingClient ? `<button class="btn btn-outline" id="cancel-edit">Annulla</button>` : ''}
              </div>
            </section>

            <section>
              <h3 style="margin:0 0 0.75rem 0;font-size:1rem;color:#1f2937;">Clienti</h3>
              ${this.clients.length === 0 ? `
                <div class="list-empty">Nessun cliente presente.</div>
              ` : `
                <div class="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Tariffa</th>
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${this.clients.map(client => `
                        <tr>
                          <td>${client.name}</td>
                          <td>€${client.hourly_rate.toFixed(2)}/h</td>
                          <td>
                            <div class="actions">
                              <button class="btn btn-outline" data-action="edit" data-id="${client.id}">Modifica</button>
                              <button class="btn btn-danger" data-action="delete" data-id="${client.id}">Elimina</button>
                            </div>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              `}
            </section>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" id="close-footer">Chiudi</button>
          </div>
        </div>
      </div>
    `;

    const closeBtns = ['#close-manager', '#close-footer'].map((selector) =>
      this.shadowRoot.querySelector(selector)
    );
    closeBtns.forEach((btn) => btn && btn.addEventListener('click', () => this.close()));

    const saveBtn = this.shadowRoot.querySelector('#save-client');
    if (saveBtn) {
      saveBtn.addEventListener('click', (event) => this.handleSubmit(event));
    }

    const cancelEditBtn = this.shadowRoot.querySelector('#cancel-edit');
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', () => this.cancelEdit());
    }

    this.shadowRoot.querySelectorAll('[data-action="edit"]').forEach((btn) => {
      btn.addEventListener('click', () => this.startEdit(parseInt(btn.dataset.id)));
    });

    this.shadowRoot.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', () => this.handleDelete(parseInt(btn.dataset.id)));
    });
  }
}

customElements.define('clients-manager', ClientsManager);

