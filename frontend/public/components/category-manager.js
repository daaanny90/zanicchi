class CategoryManager extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.categories = [];
    this.isOpen = false;
    this.loading = false;
    this.handleExternalOpen = this.handleExternalOpen.bind(this);
  }

  connectedCallback() {
    window.addEventListener('categories:open-manager', this.handleExternalOpen);
    this.render();
    this.loadCategories();
  }

  disconnectedCallback() {
    window.removeEventListener('categories:open-manager', this.handleExternalOpen);
  }

  handleExternalOpen() {
    this.open();
  }

  async loadCategories() {
    try {
      this.categories = await API.categories.getAll();
      this.render();
    } catch (error) {
      console.error('Impossibile caricare le categorie:', error);
      showNotification('Impossibile caricare le categorie', 'error');
    }
  }

  open() {
    this.isOpen = true;
    this.render();
  }

  close() {
    this.isOpen = false;
    this.render();
  }

  async handleSubmit(event) {
    event.preventDefault();
    if (this.loading) return;

    const form = this.shadowRoot.querySelector('#category-form');
    const formData = new FormData(form);

    const name = formData.get('name').trim();
    const type = formData.get('type');
    const color = formData.get('color');

    if (!name) {
      showNotification('Il nome è obbligatorio', 'warning');
      return;
    }

    this.loading = true;
    this.render();

    try {
      await API.categories.create({ name, type, color });
      showNotification('Categoria creata', 'success');
      await window.reloadCategories?.();
      this.loadCategories();
      form.reset();
    } catch (error) {
      console.error('Errore salvataggio categoria:', error);
      showNotification(error.message || 'Impossibile creare la categoria', 'error');
    } finally {
      this.loading = false;
      this.render();
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
          background: var(--color-overlay);
          z-index: 2200;
          padding: 1rem;
        }
        .modal-content {
          width: 100%;
          max-width: 540px;
          background: var(--color-bg);
          color: var(--color-text-primary);
          border-radius: 0.125rem;
          box-shadow: var(--shadow-xl);
          overflow: hidden;
          border: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
        }
        .modal-header,
        .modal-footer {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--color-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-footer {
          border-top: 1px solid var(--color-border);
          border-bottom: none;
          justify-content: flex-end;
        }
        .modal-header h2 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
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
          display: grid;
          gap: 1.25rem;
        }
        form {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        }
        label {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--color-text-secondary);
          margin-bottom: 0.35rem;
        }
        input,
        select {
          border: 1px solid var(--color-border);
          border-radius: 0.125rem;
          padding: 0.5rem 0.75rem;
          font-size: 1rem;
          background: var(--color-bg);
          color: var(--color-text-primary);
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 0.6rem;
          border-bottom: 1px solid var(--color-border);
          text-align: left;
        }
        th {
          font-size: 0.85rem;
          text-transform: uppercase;
          color: var(--color-text-muted);
        }
        .color-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 1px solid var(--color-border);
        }
        .list-empty {
          text-align: center;
          padding: 1rem;
          color: var(--color-text-secondary);
        }
        .btn {
          border-radius: 0.125rem;
          padding: 0.45rem 1rem;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid transparent;
        }
        .btn-primary {
          background: var(--color-primary);
          color: #fff;
        }
        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      </style>

      <div class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Nuova Categoria Spesa</h2>
            <button class="close-btn" id="close-category">&times;</button>
          </div>
          <div class="modal-body">
            <form id="category-form">
              <div>
                <label>Nome</label>
                <input type="text" name="name" placeholder="Es. Software" required>
              </div>
              <div>
                <label>Tipo</label>
                <select name="type">
                  <option value="expense">Spesa</option>
                  <option value="income">Entrata</option>
                </select>
              </div>
              <div>
                <label>Colore</label>
                <input type="color" name="color" value="#2563eb">
              </div>
            </form>

            <section>
              <h3 style="margin:0 0 0.5rem 0;font-size:1rem;">Categorie esistenti</h3>
              ${this.categories.length === 0 ? `
                <div class="list-empty">Nessuna categoria presente.</div>
              ` : `
                <table>
                  <thead>
                    <tr>
                      <th>Categoria</th>
                      <th>Tipo</th>
                      <th>Colore</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.categories.map(cat => `
                      <tr>
                        <td>${cat.name}</td>
                        <td>${cat.type === 'income' ? 'Entrata' : 'Spesa'}</td>
                        <td><span class="color-dot" style="background:${cat.color || '#2563eb'}"></span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              `}
            </section>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" id="save-category" ${this.loading ? 'disabled' : ''}>
              ${this.loading ? 'Salvataggio...' : 'Salva categoria'}
            </button>
          </div>
        </div>
      </div>
    `;

    const closeBtn = this.shadowRoot.querySelector('#close-category');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    const saveBtn = this.shadowRoot.querySelector('#save-category');
    if (saveBtn) saveBtn.addEventListener('click', (e) => this.handleSubmit(e));
  }
}

customElements.define('category-manager', CategoryManager);

