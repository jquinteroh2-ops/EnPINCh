const { prisma } = require('../config/prisma');

async function resumen(req, res, next) {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const [
      pedidosHoy,
      pedidosMes,
      reservasHoy,
      reservasPendientes,
      ingresoHoy,
      ingresoMes,
      gastosHoy,
      gastosMes,
    ] = await Promise.all([
      prisma.pedido.count({ where: { createdAt: { gte: hoy } } }),
      prisma.pedido.count({ where: { createdAt: { gte: inicioMes } } }),
      prisma.reserva.count({ where: { fecha: { gte: hoy } } }),
      prisma.reserva.count({ where: { estado: 'PENDIENTE' } }),
      prisma.pedido.aggregate({
        where: { estado: 'ENTREGADO', createdAt: { gte: hoy } },
        _sum: { total: true },
      }),
      prisma.pedido.aggregate({
        where: { estado: 'ENTREGADO', createdAt: { gte: inicioMes } },
        _sum: { total: true },
      }),
      prisma.gasto.aggregate({
        where: { fecha: { gte: hoy } },
        _sum: { monto: true },
      }),
      prisma.gasto.aggregate({
        where: { fecha: { gte: inicioMes } },
        _sum: { monto: true },
      }),
    ]);

    const ingresoHoyVal = ingresoHoy._sum.total || 0;
    const ingresoMesVal = ingresoMes._sum.total || 0;
    const gastosHoyVal = gastosHoy._sum.monto || 0;
    const gastosMesVal = gastosMes._sum.monto || 0;

    res.json({
      pedidos: { hoy: pedidosHoy, mes: pedidosMes },
      reservas: { hoy: reservasHoy, pendientes: reservasPendientes },
      ingresos: { hoy: ingresoHoyVal, mes: ingresoMesVal },
      gastos: { hoy: gastosHoyVal, mes: gastosMesVal },
      balance: { hoy: ingresoHoyVal - gastosHoyVal, mes: ingresoMesVal - gastosMesVal },
    });
  } catch (error) {
    next(error);
  }
}

async function ventas(req, res, next) {
  try {
    const { periodo = '7d' } = req.query;

    const dias = periodo === '30d' ? 30 : periodo === '90d' ? 90 : 7;
    const desde = new Date();
    desde.setDate(desde.getDate() - dias);
    desde.setHours(0, 0, 0, 0);

    const pedidos = await prisma.pedido.findMany({
      where: { estado: 'ENTREGADO', createdAt: { gte: desde } },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Agrupar por día
    const porDia = {};
    pedidos.forEach(p => {
      const key = p.createdAt.toISOString().split('T')[0];
      if (!porDia[key]) porDia[key] = { fecha: key, total: 0, pedidos: 0 };
      porDia[key].total += p.total;
      porDia[key].pedidos += 1;
    });

    res.json(Object.values(porDia));
  } catch (error) {
    next(error);
  }
}

async function actividadReciente(req, res, next) {
  try {
    const [pedidos, reservas] = await Promise.all([
      prisma.pedido.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, numeroPedido: true, clienteNombre: true, total: true, estado: true, tipo: true, createdAt: true },
      }),
      prisma.reserva.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, nombreCliente: true, fecha: true, hora: true, personas: true, estado: true, createdAt: true },
      }),
    ]);

    const actividad = [
      ...pedidos.map(p => ({ tipo: 'pedido', ...p })),
      ...reservas.map(r => ({ tipo: 'reserva', ...r })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);

    res.json(actividad);
  } catch (error) {
    next(error);
  }
}

module.exports = { resumen, ventas, actividadReciente };
