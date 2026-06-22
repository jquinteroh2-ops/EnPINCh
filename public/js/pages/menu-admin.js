const PageMenu = (() => {
  const CATS = ['entradas', 'sopas', 'arroz', 'fideos', 'principales', 'postres', 'bebidas', 'otro'];

  async function render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2>Gestión del Menú</h2>
        <button class="btn btn-primary" id="btnNuevoPlato">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo plato
        </button>
      </div>
      <div class="filters-bar" style="margin-bottom:20px">
        <select class="filter-select" id="mCat">
          <option value="">Todas las categorías</option>
          ${CATS.map(c => `<option value="${c}">${c.charAt(0).toUpperCase()+c.slice(1)}</option>`).join('')}
        </select>
        <select class="filter-select" id="mDisp">
          <option value="">Todos</option>
          <option value="true">Disponibles</option>
          <option value="false">No disponibles</option>
        </select>
      </div>
      <div id="menuGrid" class="menu-grid-admin"></div>`;

    document.getElementById('btnNuevoPlato').addEventListener('click', () => abrirFormulario());
    ['mCat','mDisp'].forEach(id =>
      document.getElementById(id).addEventListener('change', cargar)
    );

    await cargar();
  }

  async function cargar() {
    const cat  = document.getElementById('mCat')?.value || '';
    const disp = document.getElementById('mDisp')?.value || '';
    const params = new URLSearchParams();
    if (cat)  params.set('categoria', cat);
    if (disp) params.set('disponible', disp);

    const grid = document.getElementById('menuGrid');
    grid.innerHTML = '<div class="page-loader" style="height:120px"><div class="spinner"></div></div>';

    try {
      const items = await API.menu(params.toString() ? '?' + params.toString() : '');
      if (!items.length) { grid.innerHTML = UI.emptyState('No hay platos en el menú'); return; }

      grid.innerHTML = items.map(item => `
        <div class="menu-item-card" id="mic-${item.id}">
          <div class="mic-top">
            <span class="mic-emoji">${item.emoji || '🍽️'}</span>
            <div style="flex:1;min-width:0">
              <div class="mic-name">${item.nombre}</div>
              <div class="mic-cat">${item.categoria}</div>
            </div>
          </div>
          ${item.descripcion ? `<p style="font-size:.8rem;color:var(--muted);margin:-4px 0 0">${item.descripcion}</p>` : ''}
          <div style="display:flex;align-items:center;justify-content:space-between">
            <span class="mic-price">${UI.money(item.precio)}</span>
            <span class="mic-avail ${item.disponible ? 'on' : 'off'}">${item.disponible ? 'Disponible' : 'Agotado'}</span>
          </div>
          <div class="mic-actions">
            <button class="btn btn-ghost btn-sm" onclick="PageMenu.editar('${item.id}')">Editar</button>
            <button class="btn btn-ghost btn-sm" onclick="PageMenu.toggleDisp('${item.id}')">
              ${item.disponible ? 'Desactivar' : 'Activar'}
            </button>
            <button class="btn btn-danger btn-sm" onclick="PageMenu.eliminar('${item.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
            </button>
          </div>
        </div>`).join('');
    } catch (e) {
      grid.innerHTML = UI.emptyState('Error al cargar el menú');
      UI.toast(e.message, 'error');
    }
  }

  function formHTML(item = {}) {
    return `
      <div class="form-row">
        <div class="form-group">
          <label>Nombre del plato *</label>
          <input class="form-control" id="iNombre" value="${item.nombre || ''}" placeholder="Ej: Chow Mein" />
        </div>
        <div class="form-group">
          <label>Emoji</label>
          <input class="form-control" id="iEmoji" value="${item.emoji || ''}" placeholder="🍜" style="font-size:1.2rem" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Precio ($) *</label>
          <input class="form-control" id="iPrecio" type="number" value="${item.precio || ''}" placeholder="0" />
        </div>
        <div class="form-group">
          <label>Categoría *</label>
          <select class="form-control" id="iCat">
            ${CATS.map(c => `<option value="${c}" ${item.categoria === c ? 'selected' : ''}>${c.charAt(0).toUpperCase()+c.slice(1)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Descripción</label>
        <textarea class="form-control" id="iDesc" rows="2" placeholder="Breve descripción del plato...">${item.descripcion || ''}</textarea>
      </div>`;
  }

  function abrirFormulario(item = null) {
    const esEdicion = !!item;
    UI.openModal(esEdicion ? 'Editar plato' : 'Nuevo plato', formHTML(item || {}),
      `<button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
       <button class="btn btn-primary" id="btnGuardarPlato">${esEdicion ? 'Guardar cambios' : 'Crear plato'}</button>`
    );

    document.getElementById('btnGuardarPlato').addEventListener('click', async () => {
      const data = {
        nombre: document.getElementById('iNombre').value.trim(),
        emoji: document.getElementById('iEmoji').value.trim(),
        precio: parseFloat(document.getElementById('iPrecio').value),
        categoria: document.getElementById('iCat').value,
        descripcion: document.getElementById('iDesc').value.trim(),
      };
      if (!data.nombre || isNaN(data.precio)) {
        UI.toast('Nombre y precio son obligatorios', 'error'); return;
      }
      try {
        if (esEdicion) await API.actualizarMenuItem(item.id, data);
        else await API.crearMenuItem(data);
        UI.closeModal();
        UI.toast(esEdicion ? 'Plato actualizado' : 'Plato creado', 'success');
        cargar();
      } catch (e) { UI.toast(e.message, 'error'); }
    });
  }

  async function editar(id) {
    try {
      const items = await API.menu();
      const item = items.find(i => i.id === id);
      if (item) abrirFormulario(item);
    } catch (e) { UI.toast(e.message, 'error'); }
  }

  async function toggleDisp(id) {
    try {
      await API.toggleMenuItem(id);
      UI.toast('Disponibilidad actualizada', 'success');
      cargar();
    } catch (e) { UI.toast(e.message, 'error'); }
  }

  async function eliminar(id) {
    UI.confirm('¿Eliminar este plato del menú?', async () => {
      try {
        await API.eliminarMenuItem(id);
        UI.toast('Plato eliminado', 'success'); cargar();
      } catch (e) { UI.toast(e.message, 'error'); }
    });
  }

  function destroy() {}

  return { render, destroy, editar, toggleDisp, eliminar };
})();
