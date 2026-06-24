/* const { prisma } = require('../config/prisma');

async function listar(req, res, next) {
  try {
    const { categoria, disponible } = req.query;
    const where = {};
    if (categoria) where.categoria = categoria;
    if (disponible !== undefined) where.disponible = disponible === 'true';

    const items = await prisma.menuItem.findMany({
      where,
      orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
    });

    res.json(items);
  } catch (error) {
    next(error);
  }
}

async function obtener(req, res, next) {
  try {
    const item = await prisma.menuItem.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ error: 'Plato no encontrado' });
    res.json(item);
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const { nombre, descripcion, precio, categoria, emoji, disponible } = req.body;

    const item = await prisma.menuItem.create({
      data: {
        nombre,
        descripcion,
        precio: parseFloat(precio),
        categoria,
        emoji,
        disponible: disponible !== false,
      },
    });

    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const { nombre, descripcion, precio, categoria, emoji, disponible } = req.body;

    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: {
        ...(nombre && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(precio !== undefined && { precio: parseFloat(precio) }),
        ...(categoria && { categoria }),
        ...(emoji !== undefined && { emoji }),
        ...(disponible !== undefined && { disponible }),
      },
    });

    res.json(item);
  } catch (error) {
    next(error);
  }
}

async function toggleDisponibilidad(req, res, next) {
  try {
    const item = await prisma.menuItem.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ error: 'Plato no encontrado' });

    const actualizado = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: { disponible: !item.disponible },
    });

    res.json(actualizado);
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    await prisma.menuItem.delete({ where: { id: req.params.id } });
    res.json({ mensaje: 'Plato eliminado' });
  } catch (error) {
    next(error);
  }
}

module.exports = { listar, obtener, crear, actualizar, toggleDisponibilidad, eliminar };
 */