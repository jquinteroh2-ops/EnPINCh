const { prisma } = require('../config/prisma');

async function resumen(req, res, next) {
  try {
    const { mes, anio } = req.query;
    const ahora = new Date();
    const m = parseInt(mes) || ahora.getMonth() + 1;
    const a = parseInt(anio) || ahora.getFullYear();

    const inicio = new Date(a, m - 1, 1);
    const fin = new Date(a, m, 1);

    const [ingresos, gastos, pedidosPorTipo, pedidosPorEstado] = await Promise.all([
      prisma.pedido.aggregate({
        where: { estado: 'ENTREGADO', createdAt: { gte: inicio, lt: fin } },
        _sum: { total: true },
        _count: true,
        _avg: { total: true },
      }),
      prisma.gasto.aggregate({
        where: { fecha: { gte: inicio, lt: fin } },
        _sum: { monto: true },
        _count: true,
      }),
      prisma.pedido.groupBy({
        by: ['tipo'],
        where: { createdAt: { gte: inicio, lt: fin } },
        _count: true,
        _sum: { total: true },
      }),
      prisma.pedido.groupBy({
        by: ['estado'],
        where: { createdAt: { gte: inicio, lt: fin } },
        _count: true,
      }),
    ]);

    const totalIngresos = ingresos._sum.total || 0;
    const totalGastos = gastos._sum.monto || 0;

    res.json({
      periodo: { mes: m, anio: a },
      ingresos: {
        total: totalIngresos,
        pedidos: ingresos._count,
        promedioPorPedido: ingresos._avg.total || 0,
      },
      gastos: {
        total: totalGastos,
        registros: gastos._count,
      },
      balance: totalIngresos - totalGastos,
      pedidosPorTipo,
      pedidosPorEstado,
    });
  } catch (error) {
    next(error);
  }
}

async function ingresos(req, res, next) {
  try {
    const { desde, hasta } = req.query;
    const where = { estado: 'ENTREGADO' };

    if (desde) where.createdAt = { ...where.createdAt, gte: new Date(desde) };
    if (hasta) {
      const h = new Date(hasta);
      h.setDate(h.getDate() + 1);
      where.createdAt = { ...where.createdAt, lt: h };
    }

    const pedidos = await prisma.pedido.findMany({
      where,
      select: {
        id: true, numeroPedido: true, clienteNombre: true,
        tipo: true, total: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = pedidos.reduce((s, p) => s + p.total, 0);

    res.json({ data: pedidos, total });
  } catch (error) {
    next(error);
  }
}

async function listarGastos(req, res, next) {
  try {
    const { categoria, desde, hasta, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (categoria) where.categoria = categoria;
    if (desde) where.fecha = { ...where.fecha, gte: new Date(desde) };
    if (hasta) {
      const h = new Date(hasta);
      h.setDate(h.getDate() + 1);
      where.fecha = { ...where.fecha, lt: h };
    }

    const [gastos, total] = await Promise.all([
      prisma.gasto.findMany({
        where,
        orderBy: { fecha: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.gasto.count({ where }),
    ]);

    const suma = gastos.reduce((s, g) => s + g.monto, 0);

    res.json({
      data: gastos,
      total: suma,
      meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
}

async function crearGasto(req, res, next) {
  try {
    const { concepto, monto, categoria, fecha, notas } = req.body;

    const gasto = await prisma.gasto.create({
      data: {
        concepto,
        monto: parseFloat(monto),
        categoria,
        fecha: fecha ? new Date(fecha) : new Date(),
        notas,
      },
    });

    res.status(201).json(gasto);
  } catch (error) {
    next(error);
  }
}

async function actualizarGasto(req, res, next) {
  try {
    const { concepto, monto, categoria, fecha, notas } = req.body;

    const gasto = await prisma.gasto.update({
      where: { id: req.params.id },
      data: {
        ...(concepto && { concepto }),
        ...(monto !== undefined && { monto: parseFloat(monto) }),
        ...(categoria && { categoria }),
        ...(fecha && { fecha: new Date(fecha) }),
        ...(notas !== undefined && { notas }),
      },
    });

    res.json(gasto);
  } catch (error) {
    next(error);
  }
}

async function eliminarGasto(req, res, next) {
  try {
    await prisma.gasto.delete({ where: { id: req.params.id } });
    res.json({ mensaje: 'Gasto eliminado' });
  } catch (error) {
    next(error);
  }
}

module.exports = { resumen, ingresos, listarGastos, crearGasto, actualizarGasto, eliminarGasto };
