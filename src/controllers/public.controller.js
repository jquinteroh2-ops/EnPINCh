const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.crearReserva = async (req, res) => {
  try {
    const { nombreCliente, telefono, email, fecha, hora, personas, notas } = req.body;

    const reserva = await prisma.reserva.create({
      data: {
        nombreCliente,
        telefono,
        email: email || null,
        fecha: new Date(fecha),
        hora,
        personas: parseInt(personas),
        notas: notas || null,
      },
    });

    res.status(201).json({ ok: true, id: reserva.id });
  } catch (err) {
    console.error('Error crearReserva pública:', err);
    res.status(500).json({ error: 'No se pudo guardar la reserva' });
  }
};
