const PageReservas = (() => {
  let currentPage = 1;

  async function render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2>Reservas</h2>
        <button class="btn btn-primary" id="btnNuevaReserva">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nueva reserva
        </button>
      </div>
      <div class="card">
        <div class="filters-bar">
          <select class="filter-select" id="rEstado">
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="CONFIRMADA">Confirmada</option>
            <option value="COMPLETADA">Completada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
          <input type="date" class="filter-input" id="rFecha" />
          <button class="btn btn-ghost btn-sm" id="btnLimpiarR">Limpiar</button>
        </div>
        <div class="table-wrap" id="reservasTable"></div>
        <div id="reservasPag"></div>
      </div>`;

    document.getElementById('btnNuevaReserva').addEventListener('click', () => abrirFormulario());
    document.getElementById('btnLimpiarR').addEventListener('click', () => {
      ['rEstado','rFecha'].forEach(id => document.getElementById(id).value = '');
      currentPage = 1; cargar();
    });
    ['rEstado','rFecha'].forEach(id =>
      document.getElementById(id).addEventListener('change', () => { currentPage = 1; cargar(); })
    );

    await cargar();
  }

  async function cargar() {
    const estado = document.getElementById('rEstado')?.value || '';
    const fecha  = document.getElementById('rFecha')?.value || '';
    const params = new URLSearchParams({ page: currentPage, limit: 15 });
    if (estado) params.set('estado', estado);
    if (fecha)  params.set('fecha', fecha);

    const el = document.getElementById('reservasTable');
    el.innerHTML = '<div class="page-loader" style="height:120px"><div class="spinner"></div></div>';

    try {
      const { data, meta } = await API.reservas('?' + params.toString());
      renderTabla(data, el);
      renderPaginacion(meta);
    } catch (e) {
      el.innerHTML = UI.emptyState('Error al cargar reservas');
    }
  }

  function renderTabla(reservas, el) {
    if (!reservas.length) { el.innerHTML = UI.emptyState('No hay reservas'); return; }

    el.innerHTML = `<table>
      <thead><tr>
        <th>Cliente</th><th>Teléfono</th><th>Fecha</th><th>Hora</th>
        <th>Personas</th><th>Estado</th><th>Acciones</th>
      </tr></thead>
      <tbody>${reservas.map(r => `
        <tr>
          <td class="fw-600">${r.nombreCliente}</td>
          <td class="text-muted">${r.telefono}</td>
          <td>${UI.fecha(r.fecha)}</td>
          <td>${r.hora}</td>
          <td><span style="font-weight:600">${r.personas}</span> <span class="text-muted">pers.</span></td>
          <td>${UI.estadoBadge(r.estado)}</td>
          <td>
            <div style="display:flex;gap:4px">
              <button class="btn btn-ghost btn-sm" onclick="PageReservas.editar('${r.id}')">Editar</button>
              <button class="btn btn-ghost btn-sm" onclick="PageReservas.cambiarEstado('${r.id}','${r.estado}')">Estado</button>
              <button class="btn btn-danger btn-sm" onclick="PageReservas.eliminar('${r.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
              </button>
            </div>
          </td>
        </tr>`).join('')}
      </tbody></table>`;
  }

  function renderPaginacion(meta) {
    const el = document.getElementById('reservasPag');
    if (!el || meta.pages <= 1) { if (el) el.innerHTML = ''; return; }
    el.innerHTML = `<div class="pagination">
      <button class="page-btn" ${meta.page <= 1 ? 'disabled' : ''} onclick="PageReservas.irPagina(${meta.page - 1})">‹</button>
      <span class="page-info">Página ${meta.page} de ${meta.pages} (${meta.total} total)</span>
      <button class="page-btn" ${meta.page >= meta.pages ? 'disabled' : ''} onclick="PageReservas.irPagina(${meta.page + 1})">›</button>
    </div>`;
  }

  function formHTML(r = {}) {
    return `
      <div class="form-row">
        <div class="form-group">
          <label>Nombre del cliente *</label>
          <input class="form-control" id="rNombre" value="${r.nombreCliente || ''}" placeholder="Nombre completo" />
        </div>
        <div class="form-group">
          <label>Teléfono *</label>
          <input class="form-control" id="rTelefono" value="${r.telefono || ''}" placeholder="300 000 0000" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Fecha *</label>
          <input class="form-control" id="rFechaForm" type="date" value="${r.fecha ? r.fecha.split('T')[0] : ''}" />
        </div>
        <div class="form-group">
          <label>Hora *</label>
          <input class="form-control" id="rHora" type="time" value="${r.hora || ''}" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Número de personas *</label>
          <input class="form-control" id="rPersonas" type="number" min="1" value="${r.personas || ''}" placeholder="2" />
        </div>
        <div class="form-group">
          <label>Email (opcional)</label>
          <input class="form-control" id="rEmail" value="${r.email || ''}" placeholder="correo@ejemplo.com" />
        </div>
      </div>
      <div class="form-group">
        <label>Notas</label>
        <textarea class="form-control" id="rNotas" rows="2" placeholder="Cumpleaños, silla especial...">${r.notas || ''}</textarea>
      </div>`;
  }

  function abrirFormulario(reserva = null) {
    const esEdicion = !!reserva;
    UI.openModal(esEdicion ? 'Editar reserva' : 'Nueva reserva', formHTML(reserva || {}),
      `<button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
       <button class="btn btn-primary" id="btnGuardarReserva">${esEdicion ? 'Guardar cambios' : 'Crear reserva'}</button>`
    );

    document.getElementById('btnGuardarReserva').addEventListener('click', async () => {
      const data = {
        nombreCliente: document.getElementById('rNombre').value.trim(),
        telefono: document.getElementById('rTelefono').value.trim(),
        fecha: document.getElementById('rFechaForm').value,
        hora: document.getElementById('rHora').value,
        personas: document.getElementById('rPersonas').value,
        email: document.getElementById('rEmail').value.trim(),
        notas: document.getElementById('rNotas').value.trim(),
      };

      if (!data.nombreCliente || !data.telefono || !data.fecha || !data.hora || !data.personas) {
        UI.toast('Completa los campos obligatorios', 'error'); return;
      }

      try {
        if (esEdicion) await API.actualizarReserva(reserva.id, data);
        else await API.crearReserva(data);
        UI.closeModal();
        UI.toast(esEdicion ? 'Reserva actualizada' : 'Reserva creada', 'success');
        cargar();
      } catch (e) { UI.toast(e.message, 'error'); }
    });
  }

  async function editar(id) {
    try {
      const r = await API.reserva(id);
      abrirFormulario(r);
    } catch (e) { UI.toast(e.message, 'error'); }
  }

  async function cambiarEstado(id, estadoActual) {
    const opts = ['PENDIENTE','CONFIRMADA','COMPLETADA','CANCELADA']
      .filter(e => e !== estadoActual)
      .map(e => `<option value="${e}">${{PENDIENTE:'Pendiente',CONFIRMADA:'Confirmada',COMPLETADA:'Completada',CANCELADA:'Cancelada'}[e]}</option>`)
      .join('');

    UI.openModal('Cambiar estado de reserva',
      `<div class="form-group"><label>Nuevo estado</label><select class="form-control" id="rNuevoEstado">${opts}</select></div>`,
      `<button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
       <button class="btn btn-primary" id="btnConfEstadoR">Guardar</button>`
    );

    document.getElementById('btnConfEstadoR').addEventListener('click', async () => {
      try {
        await API.estadoReserva(id, document.getElementById('rNuevoEstado').value);
        UI.closeModal(); UI.toast('Estado actualizado', 'success'); cargar();
      } catch (e) { UI.toast(e.message, 'error'); }
    });
  }

  async function eliminar(id) {
    UI.confirm('¿Eliminar esta reserva?', async () => {
      try {
        await API.eliminarReserva(id);
        UI.toast('Reserva eliminada', 'success'); cargar();
      } catch (e) { UI.toast(e.message, 'error'); }
    });
  }

  function irPagina(n) { currentPage = n; cargar(); }
  function destroy() {}

  return { render, destroy, editar, cambiarEstado, eliminar, irPagina };
})();
