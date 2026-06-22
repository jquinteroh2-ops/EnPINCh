const PageDashboard = (() => {
  let chartInstance = null;

  async function render(container) {
    container.innerHTML = `
      <div class="stats-grid" id="statsGrid">
        ${[1,2,3,4].map(() => `<div class="stat-card"><div class="spinner" style="margin:auto"></div></div>`).join('')}
      </div>
      <div class="dash-grid">
        <div class="card">
          <p class="card-title">Ventas últimos 7 días</p>
          <div class="chart-wrap"><canvas id="ventasChart"></canvas></div>
        </div>
        <div class="card">
          <p class="card-title">Actividad reciente</p>
          <div id="actividadList"><div class="spinner" style="margin:16px auto;display:block"></div></div>
        </div>
      </div>`;

    try {
      const [resumen, ventas, actividad] = await Promise.all([
        API.dashResumen(),
        API.dashVentas('7d'),
        API.dashActividad(),
      ]);

      renderStats(resumen);
      renderChart(ventas);
      renderActividad(actividad);
    } catch (e) {
      UI.toast('Error al cargar el dashboard', 'error');
    }
  }

  function renderStats(r) {
    document.getElementById('statsGrid').innerHTML = `
      <div class="stat-card">
        <div class="stat-icon red">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
        </div>
        <div><div class="stat-val">${r.pedidos.hoy}</div><div class="stat-label">Pedidos hoy</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon gold">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <div><div class="stat-val">${r.reservas.hoy}</div><div class="stat-label">Reservas hoy</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        </div>
        <div><div class="stat-val">${UI.money(r.ingresos.hoy)}</div><div class="stat-label">Ingresos hoy</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        </div>
        <div>
          <div class="stat-val ${r.balance.mes >= 0 ? 'text-success' : 'text-danger'}">${UI.money(r.balance.mes)}</div>
          <div class="stat-label">Balance del mes</div>
        </div>
      </div>`;
  }

  function renderChart(ventas) {
    const canvas = document.getElementById('ventasChart');
    if (!canvas) return;
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

    const labels = ventas.map(v => {
      const d = new Date(v.fecha + 'T00:00:00');
      return d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' });
    });
    const data = ventas.map(v => v.total);

    chartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Ventas ($)',
          data,
          backgroundColor: 'rgba(204,0,0,0.5)',
          borderColor: '#cc0000',
          borderWidth: 1,
          borderRadius: 5,
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
  }

  function renderActividad(items) {
    const el = document.getElementById('actividadList');
    if (!items.length) { el.innerHTML = UI.emptyState('Sin actividad reciente'); return; }

    el.innerHTML = `<div class="activity-list">${items.map(a => `
      <div class="activity-item">
        <div class="activity-dot ${a.tipo}"></div>
        <div class="activity-text">
          ${a.tipo === 'pedido'
            ? `<strong>Pedido #${a.numeroPedido}</strong> — ${a.clienteNombre} · ${UI.money(a.total)}`
            : `<strong>Reserva</strong> — ${a.nombreCliente} · ${a.personas} pers.`}
        </div>
        <div class="activity-time">${UI.timeAgo(a.createdAt)}</div>
      </div>`).join('')}</div>`;
  }

  function destroy() {
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
  }

  return { render, destroy };
})();
