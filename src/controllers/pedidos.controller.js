const { prisma } = require('../config/prisma');

async function listar(req, res, next) {
  try {
    const { estado, tipo, fecha, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (estado) where.estado = estado;
    if (tipo) where.tipo = tipo;
    if (fecha) {
      const inicio = new Date(fecha);
      const fin = new Date(fecha);
      fin.setDate(fin.getDate() + 1);
      where.createdAt = { gte: inicio, lt: fin };
    }

    const [pedidos, total] = await Promise.all([
      prisma.pedido.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.pedido.count({ where }),
    ]);

    res.json({
      data: pedidos,
      meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
}

async function obtener(req, res, next) {
  try {
    const pedido = await prisma.pedido.findUnique({ where: { id: req.params.id } });
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(pedido);
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const { tipo, clienteNombre, clienteTelefono, direccion, items, subtotal, total, notas } = req.body;

    const pedido = await prisma.pedido.create({
      data: {
        tipo,
        clienteNombre,
        clienteTelefono,
        direccion: tipo === 'DOMICILIO' ? direccion : null,
        items,
        subtotal: parseFloat(subtotal),
        total: parseFloat(total),
        notas,
        creadoPor: req.usuario.id,
      },
    });

    res.status(201).json(pedido);
  } catch (error) {
    next(error);
  }
}

async function actualizarEstado(req, res, next) {
  try {
    const pedido = await prisma.pedido.update({
      where: { id: req.params.id },
      data: { estado: req.body.estado },
    });
    res.json(pedido);
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    await prisma.pedido.delete({ where: { id: req.params.id } });
    res.json({ mensaje: 'Pedido eliminado' });
  } catch (error) {
    next(error);
  }
}

async function stats(req, res, next) {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [totalHoy, pendientes, enPreparacion, entregadosHoy] = await Promise.all([
      prisma.pedido.count({ where: { createdAt: { gte: hoy } } }),
      prisma.pedido.count({ where: { estado: 'PENDIENTE' } }),
      prisma.pedido.count({ where: { estado: 'EN_PREPARACION' } }),
      prisma.pedido.count({ where: { estado: 'ENTREGADO', createdAt: { gte: hoy } } }),
    ]);

    const ingresoHoy = await prisma.pedido.aggregate({
      where: { estado: 'ENTREGADO', createdAt: { gte: hoy } },
      _sum: { total: true },
    });

    res.json({
      totalHoy,
      pendientes,
      enPreparacion,
      entregadosHoy,
      ingresoHoy: ingresoHoy._sum.total || 0,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, obtener, crear, actualizarEstado, eliminar, stats };
