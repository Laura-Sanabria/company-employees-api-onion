import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed...');

    // Verificar si ya hay datos
    const userCount = await prisma.user.count();
    if (userCount > 0) {
        console.log('⚠️ La base de datos ya tiene usuarios. Elimínalos primero si queres volver a seedear.');
        console.log('Ejecuta: npx prisma migrate reset');
        return;
    }

    const hashedPassword = await bcrypt.hash('password123', 10);

    console.log('📝 Creando admins...');

    // Crear admins de Medellín
    await prisma.user.create({
        data: {
            nombre: 'Juan Pérez',
            correo: 'juan.medellin@empresa.com',
            contrasenaHash: hashedPassword,
            rol: 'ADMIN',
            ciudad: 'medellin',
        },
    });

    await prisma.user.create({
        data: {
            nombre: 'María García',
            correo: 'maria.medellin@empresa.com',
            contrasenaHash: hashedPassword,
            rol: 'ADMIN',
            ciudad: 'medellin',
        },
    });

    // Crear admins de Bogotá
    await prisma.user.create({
        data: {
            nombre: 'Carlos Rodríguez',
            correo: 'carlos.bogota@empresa.com',
            contrasenaHash: hashedPassword,
            rol: 'ADMIN',
            ciudad: 'bogota',
        },
    });

    await prisma.user.create({
        data: {
            nombre: 'Andrea Martínez',
            correo: 'andrea.bogota@empresa.com',
            contrasenaHash: hashedPassword,
            rol: 'ADMIN',
            ciudad: 'bogota',
        },
    });

    console.log('🏢 Creando empresas...');

    // Crear empresas
    const comp1 = await prisma.company.create({
        data: {
            nombre: 'Tecnología Medellín SAS',
            direccion: 'Calle 50 #45-67',
            telefono: '6041234567',
            ciudad: 'medellin',
        },
    });

    const comp2 = await prisma.company.create({
        data: {
            nombre: 'Bogotá Business Group',
            direccion: 'Carrera 15 #88-90',
            telefono: '6019876543',
            ciudad: 'bogota',
        },
    });

    const comp3 = await prisma.company.create({
        data: {
            nombre: 'Innovación Colombia',
            direccion: 'Cra 42 #20-30',
            telefono: '6047654321',
            ciudad: 'medellin',
        },
    });

    console.log('👥 Creando empleados...');

    // Crear empleados
    const empleados = [
        { nombre: 'Pedro', apellido: 'López', correo: 'pedro@empresa.com', cargo: 'Desarrollador', salario: 3500000, companiaId: comp1.id, ciudad: 'medellin' },
        { nombre: 'Laura', apellido: 'Fernández', correo: 'laura@empresa.com', cargo: 'Analista de Negocios', salario: 3200000, companiaId: comp2.id, ciudad: 'bogota' },
        { nombre: 'Rafael', apellido: 'Sánchez', correo: 'rafael@empresa.com', cargo: 'Diseñador UI', salario: 2800000, companiaId: comp1.id, ciudad: 'medellin' },
        { nombre: 'Sofía', apellido: 'Ramírez', correo: 'sofia@empresa.com', cargo: 'Project Manager', salario: 4500000, companiaId: comp2.id, ciudad: 'bogota' },
        { nombre: 'Diego', apellido: 'Torres', correo: 'diego@empresa.com', cargo: 'Tester QA', salario: 3000000, companiaId: comp2.id, ciudad: 'bogota' },
        { nombre: 'Carmen', apellido: 'Ruiz', correo: 'carmen@empresa.com', cargo: 'Especialista DevOps', salario: 4000000, companiaId: comp3.id, ciudad: 'medellin' },
    ];

    for (const emp of empleados) {
        // 1. Crear en la tabla User (para poder autenticarse con su email y rol EMPLEADO si fuera necesario)
        await prisma.user.create({
            data: {
                nombre: `${emp.nombre} ${emp.apellido}`,
                correo: emp.correo,
                contrasenaHash: hashedPassword,
                rol: 'EMPLEADO',
                ciudad: emp.ciudad,
                companiaId: emp.companiaId,
            },
        });

        // 2. Crear en la tabla Employee (para la gestión y visualización de empleados en el negocio)
        await prisma.employee.create({
            data: {
                nombre: emp.nombre,
                apellido: emp.apellido,
                correo: emp.correo,
                cargo: emp.cargo,
                salario: emp.salario,
                companiaId: emp.companiaId,
            },
        });
    }

    console.log('✅ Seed completado exitosamente!');
    console.log('\n📊 Resumen:');
    console.log('   - Admins creados: 4 (2 Medellín, 2 Bogotá)');
    console.log('   - Empleados creados: 6');
    console.log('   - Empresas creadas: 3');
    console.log('\n🔑 Credenciales de prueba:');
    console.log('   ✨ Admin Medellín (CRUD completo):');
    console.log('      📧 juan.medellin@empresa.com');
    console.log('      📧 maria.medellin@empresa.com');
    console.log('   ✨ Admin Bogotá (Sin DELETE, PATCH permitido):');
    console.log('      📧 carlos.bogota@empresa.com');
    console.log('      📧 andrea.bogota@empresa.com');
    console.log('   ✨ Empleados (solo lectura):');
    console.log('      📧 pedro@empresa.com');
    console.log('   🔐 Contraseña para todos: password123');
}

main()
    .catch((e) => {
        console.error('❌ Error en el seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });