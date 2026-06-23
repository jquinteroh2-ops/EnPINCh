// ─── PROTEGER RUTA ────────────────────────────────────────
if (!localStorage.getItem('token')) {
  window.location.href = '/login.html';
}

// ─── ESTADO ───────────────────────────────────────────────
const PAGES = {
  dashboard:     { module: PageDashboard,    title: 'Dashboard' },
  pedidos:       { module: PagePedidos,      title: 'Pedidos' },
  reservas:      { module: PageReservas,     title: 'Reservas' },
 /*  menu:          { module: PageMenu,         title: 'Menú' }, */
  contabilidad:  { module: PageContabilidad, title: 'Contabilidad' },
};

let currentPage = null;
let currentModule = null;

// ─── INICIALIZAR UI ───────────────────────────────────────
function initUI() {
  // Usuario en sidebar
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  if (usuario.nombre) {
    document.getElementById('userName').textContent = usuario.nombre;
    document.getElementById('userRole').textContent = usuario.rol === 'SUPER_ADMIN' ? 'Super Admin' : 'Administrador';
    document.getElementById('userAvatar').textContent = usuario.nombre.charAt(0).toUpperCase();
  }

  // Fecha en topbar
  const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  document.getElementById('topbarDate').textContent = new Date().toLocaleDateString('es-CO', opts);

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login.html';
  });

  // Toggle sidebar móvil
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('visible');
  });
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
  });

  // Cerrar modal al hacer click en backdrop
  document.getElementById('modalBackdrop').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modalBackdrop')) UI.closeModal();
  });
  document.getElementById('modalClose').addEventListener('click', UI.closeModal);

  // Navegación
  document.querySelectorAll('.nav-item[data-page]').forEach(link => {
    link.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('visible');
    });
  });
}

// ─── ROUTER ───────────────────────────────────────────────
function getPage() {
  const hash = window.location.hash.replace('#', '');
  return PAGES[hash] ? hash : 'dashboard';
}

async function navigate(page) {
  if (page === currentPage) return;

  if (currentModule?.destroy) currentModule.destroy();

  const config = PAGES[page];
  if (!config) return;

  currentPage = page;
  currentModule = config.module;

  // Actualizar nav activo
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // Título
  document.getElementById('pageTitle').textContent = config.title;

  // Renderizar
  const container = document.getElementById('mainContent');
  UI.showLoader();

  try {
    await config.module.render(container);
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><p>Error al cargar la página: ${e.message}</p></div>`;
    UI.toast('Error al cargar la página', 'error');
  }
}

// ─── ARRANCAR ─────────────────────────────────────────────
initUI();

window.addEventListener('hashchange', () => navigate(getPage()));

navigate(getPage());
