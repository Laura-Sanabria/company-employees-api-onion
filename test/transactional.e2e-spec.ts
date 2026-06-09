import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe, BadRequestException, UnprocessableEntityException } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { PrismaExceptionFilter } from '../src/api/filters/prisma-exception.filter';
import { formatValidationErrors } from '../src/api/pipes/validation.util';
import { JwtService } from '@nestjs/jwt';

describe('Transactional endpoint (Integración/E2E Rollback)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let setupCompanyId: number;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        exceptionFactory: (errors) => {
          const errores = formatValidationErrors(errors);
          const queryFields = new Set(['pagina', 'tamano', 'orden', 'dir', 'buscar']);
          const soloQueryParams =
            errors.length > 0 && errors.every((e) => queryFields.has(e.property));

          if (soloQueryParams) {
            return new BadRequestException({
              mensaje: 'Parámetros de consulta inválidos',
              errores,
            });
          }

          return new UnprocessableEntityException({
            mensaje: 'Error de validación',
            errores,
          });
        },
      }),
    );

    app.useGlobalFilters(new PrismaExceptionFilter());

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    const jwtService = app.get<JwtService>(JwtService);

    // Crear una compañía inicial y un empleado de prueba con email duplicado en BD
    const company = await prisma.company.create({
      data: {
        nombre: 'SETUP_COMPANY_TEST',
        direccion: 'Calle Setup 1',
        telefono: '7654321',
      },
    });
    setupCompanyId = company.id;

    await prisma.employee.create({
      data: {
        nombre: 'SETUP_EMPLOYEE_TEST',
        apellido: 'Setup',
        correo: 'duplicado@ejemplo.com', // Este correo se usará para forzar la colisión
        cargo: 'Soporte',
        salario: 1500000,
        companiaId: setupCompanyId,
      },
    });

    const adminUser = await prisma.user.create({
      data: {
        nombre: 'Admin Tx Test',
        correo: 'admin.tx.test@ejemplo.com',
        contrasenaHash: 'hash_test',
        rol: 'ADMIN',
      },
    });

    adminToken = jwtService.sign({ sub: adminUser.id, correo: adminUser.correo, rol: 'ADMIN' });
  });

  afterAll(async () => {
    // Limpiar base de datos
    await prisma.employee.deleteMany({
      where: {
        correo: 'duplicado@ejemplo.com',
      },
    });

    await prisma.user.deleteMany({
      where: {
        correo: 'admin.tx.test@ejemplo.com',
      },
    });

    await prisma.company.delete({
      where: {
        id: setupCompanyId,
      },
    });

    await app.close();
  });

  it('debería revertir (rollback) toda la transacción si un empleado en el lote tiene correo duplicado', async () => {
    const bodyDto = {
      nombre: 'COMPANIA_ROLLBACK_TEST', // Esta es la compañía que no debe crearse debido al rollback
      direccion: 'Av Transacciones 456',
      telefono: '9999999',
      empleados: [
        {
          nombre: 'Ana',
          apellido: 'Perez',
          correo: 'ana.perez@ejemplo.com', // Válido y único
          cargo: 'Dev',
          salario: 3000000,
        },
        {
          nombre: 'Duplicado',
          apellido: 'Colision',
          correo: 'duplicado@ejemplo.com', // DUPLICADO (Forzará el fallo en base de datos o validación de servicio)
          cargo: 'QA',
          salario: 2500000,
        },
      ],
    };

    // Hacer la petición HTTP
    const response = await request(app.getHttpServer())
      .post('/api/companias/con-empleados')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(bodyDto)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY);

    expect(response.body).toHaveProperty('mensaje', 'Error de validación');
    expect(response.body.errores[0].campo).toBe('correo');

    // VERIFICAR ROLLBACK EN BASE DE DATOS
    // 1. La compañía no debe haberse creado
    const compDb = await prisma.company.findFirst({
      where: { nombre: 'COMPANIA_ROLLBACK_TEST' },
    });
    expect(compDb).toBeNull();

    // 2. El empleado con correo 'ana.perez@ejemplo.com' tampoco debe haberse creado
    const empDb = await prisma.employee.findFirst({
      where: { correo: 'ana.perez@ejemplo.com' },
    });
    expect(empDb).toBeNull();
  });
});
