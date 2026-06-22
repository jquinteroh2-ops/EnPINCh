const PagePedidos = (() => {
  let currentPage = 1;
  const ESTADOS = ['', 'PENDIENTE', 'EN_PREPARACION', 'ENTREGADO', 'CANCELADO'];
  const TIPOS   = ['', 'DOMICILIO', 'MESA'];

  async function render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2>Pedidos</h2>
        <button class="btn btn-primary" id="btnNuevoPedido">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo pedido
        </button>
      </div>
      <div class="card">
        <div class="filters-bar">
          <select class="filter-select" id="fEstado">
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_PREPARACION">En preparación</option>
            <option value="ENTREGADO">Entregado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
          <select class="filter-select" id="fTipo">
            <option value="">Todos los tipos</option>
            <option value="DOMICILIO">Domicilio</option>
            <option value="MESA">Mesa</option>
          </select>
          <input type="date" class="filter-input" id="fFecha" />
          <button class="btn btn-ghost btn-sm" id="btnLimpiar">Limpiar</button>
        </div>
        <div class="table-wrap" id="pedidosTable"></div>
        <div id="pedidosPag"></div>
      </div>`;

    document.getElementById('btnNuevoPedido').addEventListener('click', abrirFormulario);
    document.getElementById('btnLimpiar').addEventListener('click', () => {
      ['fEstado','fTipo','fFecha'].forEach(id => document.getElementById(id).value = '');
      currentPage = 1; cargar();
    });
    ['fEstado','fTipo','fFecha'].forEach(id =>
      document.getElementById(id).addEventListener('change', () => { currentPage = 1; cargar(); })
    );

    await cargar();
  }

  async function cargar() {
    const estado = document.getElementById('fEstado')?.value || '';
    const tipo   = document.getElementById('fTipo')?.value || '';
    const fecha  = document.getElementById('fFecha')?.value || '';

    const params = new URLSearchParams({ page: currentPage, limit: 15 });
    if (estado) params.set('estado', estado);
    if (tipo)   params.set('tipo', tipo);
    if (fecha)  params.set('fecha', fecha);

    const tableEl = document.getElementById('pedidosTable');
    tableEl.innerHTML = '<div class="page-loader" style="height:120px"><div class="spinner"></div></div>';

    try {
      const { data, meta } = await API.pedidos('?' + params.toString());
      renderTabla(data, tableEl);
      renderPaginacion(meta);
    } catch (e) {
      tableEl.innerHTML = UI.emptyState('Error al cargar pedidos');
      UI.toast(e.message, 'error');
    }
  }

  function renderTabla(pedidos, el) {
    if (!pedidos.length) { el.innerHTML = UI.emptyState('No hay pedidos'); return; }

    el.innerHTML = `<table>
      <thead><tr>
        <th>#</th><th>Cliente</th><th>Tipo</th><th>Items</th>
        <th>Total</th><th>Estado</th><th>Fecha</th><th>Acciones</th>
      </tr></thead>
      <tbody>${pedidos.map(p => `
        <tr>
          <td class="fw-600">#${p.numeroPedido}</td>
          <td>
            <div class="fw-600">${p.clienteNombre}</div>
            <div class="text-muted" style="font-size:.78rem">${p.clienteTelefono}</div>
          </td>
          <td>${UI.tipoBadge(p.tipo)}</td>
          <td class="text-muted" style="font-size:.82rem">${Array.isArray(p.items) ? p.items.map(i => i.name || i.nombre).join(', ') : '—'}</td>
          <td class="fw-600 text-gold">${UI.money(p.total)}</td>
          <td>${UI.estadoBadge(p.estado)}</td>
          <td class="text-muted" style="font-size:.82rem">${UI.fechaHora(p.createdAt)}</td>
          <td>
            <div style="display:flex;gap:4px">
              <button class="btn btn-ghost btn-sm" onclick="PagePedidos.verDetalle('${p.id}')">Ver</button>
              <button class="btn btn-ghost btn-sm" onclick="PagePedidos.cambiarEstado('${p.id}','${p.estado}')">Estado</button>
              <button class="btn btn-danger btn-sm" onclick="PagePedidos.eliminar('${p.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
              </button>
            </div>
          </td>
        </tr>`).join('')}
      </tbody></table>`;
  }

  function renderPaginacion(meta) {
    const el = document.getElementById('pedidosPag');
    if (!el || meta.pages <= 1) { if (el) el.innerHTML = ''; return; }
    el.innerHTML = `<div class="pagination">
      <button class="page-btn" ${meta.page <= 1 ? 'disabled' : ''} onclick="PagePedidos.irPagina(${meta.page - 1})">‹</button>
      <span class="page-info">Página ${meta.page} de ${meta.pages} (${meta.total} total)</span>
      <button class="page-btn" ${meta.page >= meta.pages ? 'disabled' : ''} onclick="PagePedidos.irPagina(${meta.page + 1})">›</button>
    </div>`;
  }

  async function verDetalle(id) {
    try {
      const p = await API.pedido(id);
      const items = Array.isArray(p.items) ? p.items : [];
      UI.openModal(`Pedido #${p.numeroPedido}`,
        `<div style="display:flex;flex-direction:column;gap:12px">
          <div class="form-row">
            <div><p class="text-muted" style="font-size:.78rem;margin-bottom:3px">Cliente</p><p class="fw-600">${p.clienteNombre}</p></div>
            <div><p class="text-muted" style="font-size:.78rem;margin-bottom:3px">Teléfono</p><p>${p.clienteTelefono}</p></div>
          </div>
          <div class="form-row">
            <div><p class="text-muted" style="font-size:.78rem;margin-bottom:3px">Tipo</p>${UI.tipoBadge(p.tipo)}</div>
            <div><p class="text-muted" style="font-size:.78rem;margin-bottom:3px">Estado</p>${UI.estadoBadge(p.estado)}</div>
          </div>
          ${p.direccion ? `<div><p class="text-muted" style="font-size:.78rem;margin-bottom:3px">Dirección</p><p>${p.direccion}</p></div>` : ''}
          <div>
            <p class="text-muted" style="font-size:.78rem;margin-bottom:8px">Ítems del pedido</p>
            ${items.map(i => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
              <span>${i.emoji || ''} ${i.name || i.nombre} ${i.qty ? `x${i.qty}` : ''}</span>
              <span class="text-gold fw-600">${UI.money(i.price || i.precio)}</span>
            </div>`).join('')}
            <div style="display:flex;justify-content:space-between;padding:10px 0;font-weight:700">
              <span>Total</span><span class="text-gold">${UI.money(p.total)}</span>
            </div>
          </div>
          ${p.notas ? `<div><p class="text-muted" style="font-size:.78rem;margin-bottom:3px">Notas</p><p>${p.notas}</p></div>` : ''}
        </div>`,
        `<button class="btn btn-ghost" onclick="UI.closeModal()">Cerrar</button>`
      );
    } catch (e) { UI.toast(e.message, 'error'); }
  }

  async function cambiarEstado(id, estadoActual) {
    const options = ['PENDIENTE','EN_PREPARACION','ENTREGADO','CANCELADO']
      .filter(e => e !== estadoActual)
      .map(e => `<option value="${e}">${{PENDIENTE:'Pendiente',EN_PREPARACION:'En preparación',ENTREGADO:'Entregado',CANCELADO:'Cancelado'}[e]}</option>`)
      .join('');

    UI.openModal('Cambiar estado del pedido',
      `<div class="form-group">
        <label>Nuevo estado</label>
        <select class="form-control" id="nuevoEstado">${options}</select>
      </div>`,
      `<button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
       <button class="btn btn-primary" id="btnConfEstado">Guardar</button>`
    );

    document.getElementById('btnConfEstado').addEventListener('click', async () => {
      const nuevo = document.getElementById('nuevoEstado').value;
      try {
        await API.estadoPedido(id, nuevo);
        UI.closeModal();
        UI.toast('Estado actualizado', 'success');
        cargar();
      } catch (e) { UI.toast(e.message, 'error'); }
    });
  }

  async function eliminar(id) {
    UI.confirm('¿Eliminar este pedido? Esta acción no se puede deshacer.', async () => {
      try {
        await API.eliminarPedido(id);
        UI.toast('Pedido eliminado', 'success');
        cargar();
      } catch (e) { UI.toast(e.message, 'error'); }
    });
  }

  function abrirFormulario() {
    UI.openModal('Nuevo pedido',
      `<div class="form-row">
        <div class="form-group">
          <label>Nombre del cliente *</label>
          <input class="form-control" id="pNombre" placeholder="Nombre completo" />
        </div>
        <div class="form-group">
          <label>Teléfono *</label>
          <input class="form-control" id="pTelefono" placeholder="300 000 0000" />
        </div>
      </div>
      <div class="form-group">
        <label>Tipo de pedido *</label>
        <select class="form-control" id="pTipo">
          <option value="DOMICILIO">Domicilio</option>
          <option value="MESA">Mesa</option>
        </select>
      </div>
      <div class="form-group" id="pDireccionGroup">
        <label>Dirección de entrega *</label>
        <input class="form-control" id="pDireccion" placeholder="Calle, barrio..." />
      </div>
      <div class="form-group">
        <label>Total ($) *</label>
        <input class="form-control" id="pTotal" type="number" placeholder="0" />
      </div>
      <div class="form-group">
        <label>Notas</label>
        <input class="form-control" id="pNotas" placeholder="Sin cebolla, extra picante..." />
      </div>`,
      `<button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
       <button class="btn btn-primary" id="btnGuardarPedido">Crear pedido</button>`
    );

    document.getElementById('pTipo').addEventListener('change', e => {
      document.getElementById('pDireccionGroup').style.display = e.target.value === 'DOMICILIO' ? '' : 'none';
    });

    document.getElementById('btnGuardarPedido').addEventListener('click', async () => {
      const nombre   = document.getElementById('pNombre').value.trim();
      const telefono = document.getElementById('pTelefono').value.trim();
      const tipo     = document.getElementById('pTipo').value;
      const total    = parseFloat(document.getElementById('pTotal').value);

      if (!nombre || !telefono || isNaN(total)) {
        UI.toast('Completa los campos obligatorios', 'error'); return;
      }

      try {
        await API.crearPedido({
          tipo, clienteNombre: nombre, clienteTelefono: telefono,
          direccion: document.getElementById('pDireccion').value,
          items: [], subtotal: total, total,
          notas: document.getElementById('pNotas').value,
        });
        UI.closeModal();
        UI.toast('Pedido creado', 'success');
        cargar();
      } catch (e) { UI.toast(e.message, 'error'); }
    });
  }

  function irPagina(n) { currentPage = n; cargar(); }
  function destroy() {}

  return { render, destroy, verDetalle, cambiarEstado, eliminar, irPagina };
})();
