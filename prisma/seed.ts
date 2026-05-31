import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Campos alineados con prisma/schema.prisma:
 *
 * Company:  nombre, direccion, telefono  (fechaCreacion es @default(now()))
 * Employee: nombre, apellido, correo, cargo, salario, companiaId
 */
async function main() {
  console.log('🌱 Limpiando datos anteriores...');
  await prisma.employee.deleteMany();
  await prisma.company.deleteMany();

  console.log('🌱 Insertando datos iniciales...');

  const company1 = await prisma.company.create({
    data: {
      nombre: 'Tech Solutions SAS',
      direccion: 'Calle 45 # 10-20, Bogotá',
      telefono: '3001234567',
    },
  });

  const company2 = await prisma.company.create({
    data: {
      nombre: 'Innovation Corp',
      direccion: 'Carrera 15 # 88-30, Medellín',
      telefono: '3007654321',
    },
  });

  const company3 = await prisma.company.create({
    data: {
      nombre: 'Digital Services Ltda',
      direccion: 'Avenida 19 # 45-12, Cali',
      telefono: '3109876543',
    },
  });

  const employees = [
    {
      nombre: 'Ana',
      apellido: 'Gómez',
      correo: 'ana.gomez@tech.com',
      cargo: 'Desarrolladora',
      salario: 3500000,
      companiaId: company1.id,
    },
    {
      nombre: 'Carlos',
      apellido: 'Rojas',
      correo: 'carlos.rojas@tech.com',
      cargo: 'Tester',
      salario: 2800000,
      companiaId: company1.id,
    },
    {
      nombre: 'Luisa',
      apellido: 'Martínez',
      correo: 'luisa.martinez@tech.com',
      cargo: 'Project Manager',
      salario: 4200000,
      companiaId: company1.id,
    },
    {
      nombre: 'Juan',
      apellido: 'Pérez',
      correo: 'juan.perez@innovation.com',
      cargo: 'Backend Dev',
      salario: 3800000,
      companiaId: company2.id,
    },
    {
      nombre: 'María',
      apellido: 'López',
      correo: 'maria.lopez@innovation.com',
      cargo: 'Frontend Dev',
      salario: 3600000,
      companiaId: company2.id,
    },
    {
      nombre: 'Pedro',
      apellido: 'Sánchez',
      correo: 'pedro.sanchez@innovation.com',
      cargo: 'DevOps',
      salario: 4000000,
      companiaId: company2.id,
    },
    {
      nombre: 'Laura',
      apellido: 'Díaz',
      correo: 'laura.diaz@digitalservices.com',
      cargo: 'UX Designer',
      salario: 3300000,
      companiaId: company3.id,
    },
    {
      nombre: 'Andrés',
      apellido: 'Ramírez',
      correo: 'andres.ramirez@digitalservices.com',
      cargo: 'Data Analyst',
      salario: 3700000,
      companiaId: company3.id,
    },
    {
      nombre: 'Sofía',
      apellido: 'Torres',
      correo: 'sofia.torres@digitalservices.com',
      cargo: 'QA Engineer',
      salario: 3100000,
      companiaId: company3.id,
    },
    {
      nombre: 'Diego',
      apellido: 'Morales',
      correo: 'diego.morales@digitalservices.com',
      cargo: 'Tech Lead',
      salario: 5000000,
      companiaId: company3.id,
    },
  ];

  await prisma.employee.createMany({ data: employees });

  console.log('✅ Datos iniciales insertados correctamente');
  console.log('📊 Compañías: 3 | Empleados: 10');
}

main()
  .catch((e) => {
    console.error('❌ Error al insertar datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
