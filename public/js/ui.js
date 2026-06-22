const UI = (() => {

  // ─── TOAST ────────────────────────────────────────────
  function toast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  // ─── MODAL ────────────────────────────────────────────
  function openModal(title, bodyHTML, footerHTML) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    document.getElementById('modalFooter').innerHTML = footerHTML || '';
    document.getElementById('modalBackdrop').classList.remove('hidden');
  }

  function closeModal() {
    document.getElementById('modalBackdrop').classList.add('hidden');
    document.getElementById('modalBody').innerHTML = '';
    document.getElementById('modalFooter').innerHTML = '';
  }

  // ─── LOADER ───────────────────────────────────────────
  function showLoader() {
    document.getElementById('mainContent').innerHTML =
      '<div class="page-loader"><div class="spinner"></div></div>';
  }

  // ─── FORMATOS ─────────────────────────────────────────
  function money(n) {
    return `$${Number(n || 0).toLocaleString('es-CO')}`;
  }

  function fecha(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function fechaHora(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'ahora';
    if (m < 60) return `hace ${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `hace ${h}h`;
    return `hace ${Math.floor(h / 24)}d`;
  }

  // ─── BADGES ───────────────────────────────────────────
  const ESTADO_CLASS = {
    PENDIENTE: 'pendiente', EN_PREPARACION: 'preparacion',
    ENTREGADO: 'entregado', CANCELADO: 'cancelado',
    CONFIRMADA: 'confirmada', COMPLETADA: 'completada',
  };
  const ESTADO_LABEL = {
    PENDIENTE: 'Pendiente', EN_PREPARACION: 'En preparación',
    ENTREGADO: 'Entregado', CANCELADO: 'Cancelado',
    CONFIRMADA: 'Confirmada', COMPLETADA: 'Completada',
  };
  const TIPO_CLASS = { DOMICILIO: 'domicilio', MESA: 'mesa' };
  const TIPO_LABEL = { DOMICILIO: 'Domicilio', MESA: 'Mesa' };

  function badge(value, classMap, labelMap) {
    const cls = classMap[value] || '';
    const lbl = labelMap[value] || value;
    return `<span class="badge ${cls}">${lbl}</span>`;
  }

  function estadoBadge(estado) { return badge(estado, ESTADO_CLASS, ESTADO_LABEL); }
  function tipoBadge(tipo) { return badge(tipo, TIPO_CLASS, TIPO_LABEL); }

  // ─── EMPTY STATE ──────────────────────────────────────
  function emptyState(msg = 'No hay registros') {
    return `<div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <p>${msg}</p>
    </div>`;
  }

  // ─── CONFIRM ──────────────────────────────────────────
  function confirm(msg, onYes) {
    openModal('Confirmar acción',
      `<p style="color:var(--muted);font-size:.9rem">${msg}</p>`,
      `<button class="btn btn-ghost" id="confirmNo">Cancelar</button>
       <button class="btn btn-danger" id="confirmYes">Confirmar</button>`
    );
    document.getElementById('confirmNo').addEventListener('click', closeModal);
    document.getElementById('confirmYes').addEventListener('click', () => { closeModal(); onYes(); });
  }

  return { toast, openModal, closeModal, showLoader, money, fecha, fechaHora, timeAgo, estadoBadge, tipoBadge, emptyState, confirm };
})();
