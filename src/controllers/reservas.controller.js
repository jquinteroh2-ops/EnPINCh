const { prisma } = require('../config/prisma');

async function listar(req, res, next) {
  try {
    const { estado, fecha, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (estado) where.estado = estado;
    if (fecha) {
      const inicio = new Date(fecha);
      const fin = new Date(fecha);
      fin.setDate(fin.getDate() + 1);
      where.fecha = { gte: inicio, lt: fin };
    }

    const [reservas, total] = await Promise.all([
      prisma.reserva.findMany({
        where,
        orderBy: { fecha: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.reserva.count({ where }),
    ]);

    res.json({
      data: reservas,
      meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
}

async function obtener(req, res, next) {
  try {
    const reserva = await prisma.reserva.findUnique({ where: { id: req.params.id } });
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
    res.json(reserva);
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const { nombreCliente, telefono, email, fecha, hora, personas, notas } = req.body;

    const reserva = await prisma.reserva.create({
      data: {
        nombreCliente,
        telefono,
        email,
        fecha: new Date(fecha),
        hora,
        personas: parseInt(personas),
        notas,
      },
    });

    res.status(201).json(reserva);
  } catch (error) {
    next(error);
  }
}

async function actualizarEstado(req, res, next) {
  try {
    const reserva = await prisma.reserva.update({
      where: { id: req.params.id },
      data: { estado: req.body.estado },
    });
    res.json(reserva);
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const { nombreCliente, telefono, email, fecha, hora, personas, notas } = req.body;

    const reserva = await prisma.reserva.update({
      where: { id: req.params.id },
      data: {
        ...(nombreCliente && { nombreCliente }),
        ...(telefono && { telefono }),
        ...(email !== undefined && { email }),
        ...(fecha && { fecha: new Date(fecha) }),
        ...(hora && { hora }),
        ...(personas && { personas: parseInt(personas) }),
        ...(notas !== undefined && { notas }),
      },
    });

    res.json(reserva);
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    await prisma.reserva.delete({ where: { id: req.params.id } });
    res.json({ mensaje: 'Reserva eliminada' });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, obtener, crear, actualizarEstado, actualizar, eliminar };
