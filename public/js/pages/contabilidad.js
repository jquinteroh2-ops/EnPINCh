const PageContabilidad = (() => {
  let tabActiva = 'ingresos';
  let chartInstance = null;

  async function render(container) {
    const now = new Date();
    container.innerHTML = `
      <div class="page-header">
        <h2>Contabilidad</h2>
        <div class="period-selector">
          <select id="cMes">
            ${['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
              .map((m,i) => `<option value="${i+1}" ${i+1===now.getMonth()+1?'selected':''}>${m}</option>`).join('')}
          </select>
          <select id="cAnio">
            ${[now.getFullYear()-1, now.getFullYear()].map(y => `<option value="${y}" ${y===now.getFullYear()?'selected':''}>${y}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="cont-summary" id="contSummary">
        ${[1,2,3].map(()=>`<div class="cont-card"><div class="spinner" style="margin:auto;display:block"></div></div>`).join('')}
      </div>

      <div class="card" style="margin-bottom:20px">
        <p class="card-title">Ingresos por día</p>
        <div class="chart-wrap"><canvas id="contChart"></canvas></div>
      </div>

      <div class="card">
        <div class="cont-tabs">
          <button class="cont-tab active" id="tabIngresos" onclick="PageContabilidad.setTab('ingresos')">Ingresos</button>
          <button class="cont-tab" id="tabGastos" onclick="PageContabilidad.setTab('gastos')">Gastos</button>
        </div>
        <div id="contTabContent"></div>
      </div>`;

    ['cMes','cAnio'].forEach(id =>
      document.getElementById(id).addEventListener('change', () => cargar())
    );

    await cargar();
  }

  async function cargar() {
    const mes  = document.getElementById('cMes')?.value;
    const anio = document.getElementById('cAnio')?.value;
    if (!mes || !anio) return;

    try {
      const resumen = await API.contResumen(mes, anio);
      renderSummary(resumen);
      renderChart(mes, anio);
    } catch (e) { UI.toast(e.message, 'error'); }

    await cargarTab();
  }

  function renderSummary(r) {
    document.getElementById('contSummary').innerHTML = `
      <div class="cont-card">
        <div class="cont-card-label">Ingresos del mes</div>
        <div class="cont-card-val green">${UI.money(r.ingresos.total)}</div>
        <div class="text-muted" style="font-size:.78rem;margin-top:4px">${r.ingresos.pedidos} pedidos entregados</div>
      </div>
      <div class="cont-card">
        <div class="cont-card-label">Gastos del mes</div>
        <div class="cont-card-val red">${UI.money(r.gastos.total)}</div>
        <div class="text-muted" style="font-size:.78rem;margin-top:4px">${r.gastos.registros} registros</div>
      </div>
      <div class="cont-card">
        <div class="cont-card-label">Balance</div>
        <div class="cont-card-val ${r.balance >= 0 ? 'green' : 'red'}">${UI.money(r.balance)}</div>
        <div class="text-muted" style="font-size:.78rem;margin-top:4px">${r.balance >= 0 ? 'Superávit' : 'Déficit'}</div>
      </div>`;
  }

  async function renderChart(mes, anio) {
    const canvas = document.getElementById('contChart');
    if (!canvas) return;
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

    try {
      const inicio = `${anio}-${String(mes).padStart(2,'0')}-01`;
      const fin = new Date(anio, mes, 0);
      const finStr = `${anio}-${String(mes).padStart(2,'0')}-${String(fin.getDate()).padStart(2,'0')}`;
      const { data } = await API.contIngresos(`?desde=${inicio}&hasta=${finStr}`);

      const porDia = {};
      data.forEach(p => {
        const d = new Date(p.createdAt).toISOString().split('T')[0];
        porDia[d] = (porDia[d] || 0) + p.total;
      });

      const labels = Object.keys(porDia).map(d => d.split('-')[2]);
      const values = Object.values(porDia);

      chartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Ingresos ($)',
            data: values,
            backgroundColor: 'rgba(34,197,94,0.4)',
            borderColor: '#22c55e',
            borderWidth: 1, borderRadius: 4,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#7b82a8', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#7b82a8', font: { size: 11 }, callback: v => `$${(v/1000).toFixed(0)}k` }, grid: { color: 'rgba(255,255,255,0.05)' } },
          },
        },
      });
    } catch {}
  }

  async function cargarTab() {
    const el = document.getElementById('contTabContent');
    if (!el) return;
    el.innerHTML = '<div class="page-loader" style="height:100px"><div class="spinner"></div></div>';

    const mes  = document.getElementById('cMes')?.value;
    const anio = document.getElementById('cAnio')?.value;
    const inicio = `${anio}-${String(mes).padStart(2,'0')}-01`;
    const fin = new Date(anio, mes, 0);
    const finStr = `${anio}-${String(mes).padStart(2,'0')}-${String(fin.getDate()).padStart(2,'0')}`;

    try {
      if (tabActiva === 'ingresos') {
        const { data } = await API.contIngresos(`?desde=${inicio}&hasta=${finStr}`);
        el.innerHTML = renderTablaIngresos(data);
      } else {
        const { data } = await API.contGastos(`?desde=${inicio}&hasta=${finStr}`);
        el.innerHTML = renderTablaGastos(data);
      }
    } catch (e) { el.innerHTML = UI.emptyState('Error al cargar datos'); }
  }

  function renderTablaIngresos(data) {
    if (!data.length) return UI.emptyState('Sin ingresos en este período');
    return `<div class="table-wrap"><table>
      <thead><tr><th>#</th><th>Cliente</th><th>Tipo</th><th>Total</th><th>Fecha</th></tr></thead>
      <tbody>${data.map(p => `
        <tr>
          <td class="fw-600">#${p.numeroPedido}</td>
          <td>${p.clienteNombre}</td>
          <td>${UI.tipoBadge(p.tipo)}</td>
          <td class="fw-600 text-success">${UI.money(p.total)}</td>
          <td class="text-muted" style="font-size:.82rem">${UI.fechaHora(p.createdAt)}</td>
        </tr>`).join('')}
      </tbody></table></div>`;
  }

  function renderTablaGastos(data) {
    const catLabels = { INGREDIENTES:'Ingredientes', SERVICIOS:'Servicios', NOMINA:'Nómina', MANTENIMIENTO:'Mantenimiento', OTRO:'Otro' };
    const header = `<div style="display:flex;justify-content:flex-end;margin-bottom:12px">
      <button class="btn btn-primary" onclick="PageContabilidad.nuevoGasto()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Registrar gasto
      </button></div>`;

    if (!data.length) return header + UI.emptyState('Sin gastos en este período');

    return header + `<div class="table-wrap"><table>
      <thead><tr><th>Concepto</th><th>Categoría</th><th>Monto</th><th>Fecha</th><th>Acciones</th></tr></thead>
      <tbody>${data.map(g => `
        <tr>
          <td class="fw-600">${g.concepto}</td>
          <td><span class="badge preparacion">${catLabels[g.categoria] || g.categoria}</span></td>
          <td class="fw-600 text-danger">${UI.money(g.monto)}</td>
          <td class="text-muted" style="font-size:.82rem">${UI.fecha(g.fecha)}</td>
          <td>
            <button class="btn btn-danger btn-sm" onclick="PageContabilidad.eliminarGasto('${g.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
            </button>
          </td>
        </tr>`).join('')}
      </tbody></table></div>`;
  }

  function setTab(tab) {
    tabActiva = tab;
    document.getElementById('tabIngresos').classList.toggle('active', tab === 'ingresos');
    document.getElementById('tabGastos').classList.toggle('active', tab === 'gastos');
    cargarTab();
  }

  function nuevoGasto() {
    UI.openModal('Registrar gasto',
      `<div class="form-group">
        <label>Concepto *</label>
        <input class="form-control" id="gConcepto" placeholder="Ej: Compra de ingredientes" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Monto ($) *</label>
          <input class="form-control" id="gMonto" type="number" placeholder="0" />
        </div>
        <div class="form-group">
          <label>Categoría *</label>
          <select class="form-control" id="gCat">
            <option value="INGREDIENTES">Ingredientes</option>
            <option value="SERVICIOS">Servicios</option>
            <option value="NOMINA">Nómina</option>
            <option value="MANTENIMIENTO">Mantenimiento</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Fecha</label>
        <input class="form-control" id="gFecha" type="date" value="${new Date().toISOString().split('T')[0]}" />
      </div>
      <div class="form-group">
        <label>Notas</label>
        <input class="form-control" id="gNotas" placeholder="Detalles adicionales..." />
      </div>`,
      `<button class="btn btn-ghost" onclick="UI.closeModal()">Cancelar</button>
       <button class="btn btn-primary" id="btnGuardarGasto">Registrar</button>`
    );

    document.getElementById('btnGuardarGasto').addEventListener('click', async () => {
      const concepto = document.getElementById('gConcepto').value.trim();
      const monto = parseFloat(document.getElementById('gMonto').value);
      if (!concepto || isNaN(monto) || monto <= 0) {
        UI.toast('Concepto y monto son obligatorios', 'error'); return;
      }
      try {
        await API.crearGasto({
          concepto, monto,
          categoria: document.getElementById('gCat').value,
          fecha: document.getElementById('gFecha').value,
          notas: document.getElementById('gNotas').value,
        });
        UI.closeModal(); UI.toast('Gasto registrado', 'success');
        cargar();
      } catch (e) { UI.toast(e.message, 'error'); }
    });
  }

  async function eliminarGasto(id) {
    UI.confirm('¿Eliminar este gasto?', async () => {
      try {
        await API.eliminarGasto(id);
        UI.toast('Gasto eliminado', 'success'); cargar();
      } catch (e) { UI.toast(e.message, 'error'); }
    });
  }

  function destroy() {
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
  }

  return { render, destroy, setTab, nuevoGasto, eliminarGasto };
})();
