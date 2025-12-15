class CategoryManager extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.categories = [];
    this.isOpen = false;
    this.loading = false;
    this.editingCategory = null; // Track which category is being edited
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
    const color = formData.get('color');

    if (!name) {
      showNotification('Il nome è obbligatorio', 'warning');
      return;
    }

    this.loading = true;
    this.render();

    try {
      if (this.editingCategory) {
        // Update existing category
        await API.categories.update(this.editingCategory.id, { name, color });
        showNotification('Categoria aggiornata', 'success');
        this.editingCategory = null;
      } else {
        // Create new category
        await API.categories.create({ name, color });
        showNotification('Categoria creata', 'success');
      }
      await window.reloadCategories?.();
      this.loadCategories();
      form.reset();
    } catch (error) {
      console.error('Errore salvataggio categoria:', error);
      showNotification(error.message || 'Impossibile salvare la categoria', 'error');
    } finally {
      this.loading = false;
      this.render();
    }
  }

  editCategory(category) {
    this.editingCategory = category;
    this.render();
    // Populate form with category data
    const form = this.shadowRoot.querySelector('#category-form');
    if (form) {
      form.querySelector('[name="name"]').value = category.name;
      form.querySelector('[name="color"]').value = category.color || '#2563eb';
    }
  }

  cancelEdit() {
    this.editingCategory = null;
    const form = this.shadowRoot.querySelector('#category-form');
    if (form) form.reset();
    this.render();
  }

  async deleteCategory(category) {
    if (category.name === 'Senza Categoria') {
      showNotification('Non puoi eliminare la categoria "Senza Categoria"', 'warning');
      return;
    }

    if (!confirm(`Sei sicuro di voler eliminare la categoria "${category.name}"?\n\nLe spese con questa categoria saranno spostate in "Senza Categoria".`)) {
      return;
    }

    this.loading = true;
    this.render();

    try {
      await API.categories.delete(category.id);
      showNotification('Categoria eliminata', 'success');
      await window.reloadCategories?.();
      this.loadCategories();
    } catch (error) {
      console.error('Errore eliminazione categoria:', error);
      showNotification(error.message || 'Impossibile eliminare la categoria', 'error');
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
          border-radius: 0.375rem;
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
          border-radius: 0.375rem;
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
          border-radius: 0.375rem;
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
        .btn-secondary {
          background: var(--color-bg-tertiary);
          color: var(--color-text-primary);
        }
        .btn-small {
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          margin-right: 0.25rem;
        }
        .btn-edit {
          background: var(--color-primary);
          color: white;
        }
        .btn-delete {
          background: var(--color-danger);
          color: white;
        }
      </style>

      <div class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>${this.editingCategory ? 'Modifica Categoria' : 'Nuova Categoria Spesa'}</h2>
            <button class="close-btn" id="close-category">&times;</button>
          </div>
          <div class="modal-body">
            <form id="category-form">
              <div>
                <label>Nome</label>
                <input type="text" name="name" placeholder="Es. Software" required>
              </div>
              <div>
                <label>Colore</label>
                <input type="color" name="color" value="#2563eb">
              </div>
            </form>

            <section style="margin-top: 1.5rem;">
              <h3 style="margin:0 0 0.5rem 0;font-size:1rem;">Categorie esistenti</h3>
              ${this.categories.length === 0 ? `
                <div class="list-empty">Nessuna categoria presente.</div>
              ` : `
                <table>
                  <thead>
                    <tr>
                      <th>Categoria</th>
                      <th>Colore</th>
                      <th style="text-align: right;">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.categories.map(cat => `
                      <tr>
                        <td>${cat.name}</td>
                        <td><span class="color-dot" style="background:${cat.color || '#2563eb'}"></span></td>
                        <td style="text-align: right;">
                          <button class="btn btn-small btn-edit" data-action="edit" data-id="${cat.id}">Modifica</button>
                          <button class="btn btn-small btn-delete" data-action="delete" data-id="${cat.id}" ${cat.name === 'Senza Categoria' ? 'disabled style="opacity:0.5;"' : ''}>Elimina</button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              `}
            </section>
          </div>
          <div class="modal-footer">
            ${this.editingCategory ? `
              <button class="btn btn-secondary" id="cancel-edit">Annulla</button>
            ` : ''}
            <button class="btn btn-primary" id="save-category" ${this.loading ? 'disabled' : ''}>
              ${this.loading ? 'Salvataggio...' : (this.editingCategory ? 'Aggiorna categoria' : 'Salva categoria')}
            </button>
          </div>
        </div>
      </div>
    `;

    const closeBtn = this.shadowRoot.querySelector('#close-category');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    const saveBtn = this.shadowRoot.querySelector('#save-category');
    if (saveBtn) saveBtn.addEventListener('click', (e) => this.handleSubmit(e));

    const cancelBtn = this.shadowRoot.querySelector('#cancel-edit');
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.cancelEdit());

    // Add event listeners for edit and delete buttons
    this.shadowRoot.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        const id = parseInt(btn.getAttribute('data-id'));
        const category = this.categories.find(c => c.id === id);
        
        if (action === 'edit' && category) {
          this.editCategory(category);
        } else if (action === 'delete' && category) {
          this.deleteCategory(category);
        }
      });
    });
  }
}

customElements.define('category-manager', CategoryManager);

