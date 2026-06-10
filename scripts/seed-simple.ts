import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed...');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Crear admins de Medellín
    await prisma.user.upsert({
        where: { correo: 'juan.medellin@empresa.com' },
        update: {},
        create: {
            nombre: 'Juan Pérez',
            correo: 'juan.medellin@empresa.com',
            contrasenaHash: hashedPassword,
            rol: 'ADMIN',
            ciudad: 'medellin',
        },
    });

    await prisma.user.upsert({
        where: { correo: 'maria.medellin@empresa.com' },
        update: {},
        create: {
            nombre: 'María García',
            correo: 'maria.medellin@empresa.com',
            contrasenaHash: hashedPassword,
            rol: 'ADMIN',
            ciudad: 'medellin',
        },
    });

    // Crear admins de Bogotá
    await prisma.user.upsert({
        where: { correo: 'carlos.bogota@empresa.com' },
        update: {},
        create: {
            nombre: 'Carlos Rodríguez',
            correo: 'carlos.bogota@empresa.com',
            contrasenaHash: hashedPassword,
            rol: 'ADMIN',
            ciudad: 'bogota',
        },
    });

    await prisma.user.upsert({
        where: { correo: 'andrea.bogota@empresa.com' },
        update: {},
        create: {
            nombre: 'Andrea Martínez',
            correo: 'andrea.bogota@empresa.com',
            contrasenaHash: hashedPassword,
            rol: 'ADMIN',
            ciudad: 'bogota',
        },
    });

    // Crear empresas
    await prisma.company.upsert({
        where: { id: 1 },
        update: {},
        create: {
            nombre: 'Tecnología Medellín SAS',
            direccion: 'Calle 50 #45-67',
            telefono: '6041234567',
            ciudad: 'medellin',
        },
    });

    await prisma.company.upsert({
        where: { id: 2 },
        update: {},
        create: {
            nombre: 'Bogotá Business Group',
            direccion: 'Carrera 15 #88-90',
            telefono: '6019876543',
            ciudad: 'bogota',
        },
    });

    // Crear empleados (usuarios con rol EMPLEADO)
    const empleados = [
        { nombre: 'Pedro López', correo: 'pedro@empresa.com', ciudad: 'medellin' },
        { nombre: 'Laura Fernández', correo: 'laura@empresa.com', ciudad: 'bogota' },
        { nombre: 'Rafael Sánchez', correo: 'rafael@empresa.com', ciudad: 'medellin' },
        { nombre: 'Sofía Ramírez', correo: 'sofia@empresa.com', ciudad: 'bogota' },
        { nombre: 'Diego Torres', correo: 'diego@empresa.com', ciudad: 'bogota' },
        { nombre: 'Carmen Ruiz', correo: 'carmen@empresa.com', ciudad: 'medellin' },
    ];

    for (const emp of empleados) {
        await prisma.user.upsert({
            where: { correo: emp.correo },
            update: {},
            create: {
                nombre: emp.nombre,
                correo: emp.correo,
                contrasenaHash: hashedPassword,
                rol: 'EMPLEADO',
                ciudad: emp.ciudad,
            },
        });
    }

    console.log('✅ Seed completado exitosamente!');
    console.log('\n📊 Resumen:');
    console.log('   - Admins creados: 4 (2 Medellín, 2 Bogotá)');
    console.log('   - Empleados creados: 6');
    console.log('   - Empresas creadas: 2');
    console.log('\n🔑 Credenciales de prueba:');
    console.log('   ✨ Admin Medellín (CRUD completo):');
    console.log('      - juan.medellin@empresa.com / password123');
    console.log('      - maria.medellin@empresa.com / password123');
    console.log('   ✨ Admin Bogotá (Sin DELETE, PATCH permitido):');
    console.log('      - carlos.bogota@empresa.com / password123');
    console.log('      - andrea.bogota@empresa.com / password123');
    console.log('   ✨ Empleados (solo lectura):');
    console.log('      - pedro@empresa.com / password123');
    console.log('      - laura@empresa.com / password123');
    console.log('      - etc.');
}

main()
    .catch((e) => {
        console.error('❌ Error en el seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });