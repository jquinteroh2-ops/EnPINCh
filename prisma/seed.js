const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Usuario administrador por defecto
  const passwordHash = await bcrypt.hash('EnPinCh2024!', 10);

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@enpinch.com' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@enpinch.com',
      password: passwordHash,
      rol: 'SUPER_ADMIN',
    },
  });

  console.log(`✅ Usuario admin creado: ${admin.email}`);
  console.log('   Contraseña inicial: EnPinCh2024!');
  console.log('   ⚠️  Cámbiala después del primer login.');

  // Menú inicial
  const menuItems = [
    { nombre: 'Rollitos Primavera', descripcion: 'Crujientes rollitos con vegetales frescos', precio: 12900, categoria: 'entradas', emoji: '🥟' },
    { nombre: 'Sopa Wonton', descripcion: 'Caldo tradicional con wontons rellenos de cerdo', precio: 14900, categoria: 'sopas', emoji: '🍲' },
    { nombre: 'Arroz Frito Especial', descripcion: 'Arroz salteado con camarones, cerdo y vegetales', precio: 18900, categoria: 'arroz', emoji: '🍚' },
    { nombre: 'Chow Mein de Pollo', descripcion: 'Fideos salteados con pollo y vegetales', precio: 19900, categoria: 'fideos', emoji: '🍜' },
    { nombre: 'Pato Laqueado', descripcion: 'Pato estilo Beijing con salsa hoisin', precio: 42900, categoria: 'principales', emoji: '🦆' },
    { nombre: 'Camarones al Wok', descripcion: 'Camarones salteados con salsa de ostras', precio: 32900, categoria: 'principales', emoji: '🦐' },
    { nombre: 'Cerdo Agridulce', descripcion: 'Cerdo crujiente con salsa agridulce cantonesa', precio: 24900, categoria: 'principales', emoji: '🥩' },
    { nombre: 'Galletas de la Fortuna', descripcion: 'Postre tradicional con mensaje especial', precio: 4900, categoria: 'postres', emoji: '🥮' },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { id: item.nombre },
      update: {},
      create: item,
    }).catch(() => prisma.menuItem.create({ data: item }));
  }

  console.log(`✅ ${menuItems.length} platos del menú creados`);
  console.log('🎉 Seed completado exitosamente');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
