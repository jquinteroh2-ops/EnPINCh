const API = (() => {
  const BASE = '/api';

  function getToken() {
    return localStorage.getItem('token');
  }

  async function request(method, path, body) {
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
    };
    if (body !== undefined) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE}${path}`, opts);

    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login.html';
      return;
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    return data;
  }

  const get    = (path)        => request('GET',    path);
  const post   = (path, body)  => request('POST',   path, body);
  const put    = (path, body)  => request('PUT',    path, body);
  const patch  = (path, body)  => request('PATCH',  path, body);
  const del    = (path)        => request('DELETE', path);

  return {
    // Auth
    login: (email, password) => post('/auth/login', { email, password }),
    me: () => get('/auth/me'),
    cambiarPassword: (data) => put('/auth/cambiar-password', data),

    // Dashboard
    dashResumen: () => get('/dashboard/resumen'),
    dashVentas: (periodo) => get(`/dashboard/ventas?periodo=${periodo}`),
    dashActividad: () => get('/dashboard/actividad'),

    // Pedidos
    pedidos: (params = '') => get(`/pedidos${params}`),
    pedido: (id) => get(`/pedidos/${id}`),
    crearPedido: (data) => post('/pedidos', data),
    estadoPedido: (id, estado) => patch(`/pedidos/${id}/estado`, { estado }),
    eliminarPedido: (id) => del(`/pedidos/${id}`),
    statsPedidos: () => get('/pedidos/stats'),

    // Reservas
    reservas: (params = '') => get(`/reservas${params}`),
    reserva: (id) => get(`/reservas/${id}`),
    crearReserva: (data) => post('/reservas', data),
    estadoReserva: (id, estado) => patch(`/reservas/${id}/estado`, { estado }),
    actualizarReserva: (id, data) => put(`/reservas/${id}`, data),
    eliminarReserva: (id) => del(`/reservas/${id}`),

    // Menú
    menu: (params = '') => get(`/menu${params}`),
    crearMenuItem: (data) => post('/menu', data),
    actualizarMenuItem: (id, data) => put(`/menu/${id}`, data),
    toggleMenuItem: (id) => patch(`/menu/${id}/disponibilidad`, {}),
    eliminarMenuItem: (id) => del(`/menu/${id}`),

    // Contabilidad
    contResumen: (mes, anio) => get(`/contabilidad/resumen?mes=${mes}&anio=${anio}`),
    contIngresos: (params = '') => get(`/contabilidad/ingresos${params}`),
    contGastos: (params = '') => get(`/contabilidad/gastos${params}`),
    crearGasto: (data) => post('/contabilidad/gastos', data),
    actualizarGasto: (id, data) => put(`/contabilidad/gastos/${id}`, data),
    eliminarGasto: (id) => del(`/contabilidad/gastos/${id}`),
  };
})();
