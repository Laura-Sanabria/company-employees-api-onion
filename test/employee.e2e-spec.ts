import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe, BadRequestException, UnprocessableEntityException } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { PrismaExceptionFilter } from '../src/api/filters/prisma-exception.filter';
import { formatValidationErrors } from '../src/api/pipes/validation.util';
import { JwtService } from '@nestjs/jwt';

describe('EmployeeController (Integración/E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let companyId: number;
  let employeeIds: number[] = [];
  let adminToken: string;
  let userToken: string;

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

    // Crear una compañía de prueba para usar en los tests
    const company = await prisma.company.create({
      data: {
        nombre: 'TEST_INTEGRATION_COMPANY',
        direccion: 'Calle Falsa 123',
        telefono: '1234567',
      },
    });
    companyId = company.id;

    // Crear usuarios de prueba para la autenticación
    const adminUser = await prisma.user.create({
      data: {
        nombre: 'Admin Emp Test',
        correo: 'admin.emp.test@ejemplo.com',
        contrasenaHash: 'no_importa_el_hash_en_test_de_guard',
        rol: 'ADMIN',
      },
    });

    const regularUser = await prisma.user.create({
      data: {
        nombre: 'User Emp Test',
        correo: 'user.emp.test@ejemplo.com',
        contrasenaHash: 'no_importa_el_hash_en_test_de_guard',
        rol: 'USUARIO',
        companiaId: companyId,
      },
    });

    adminToken = jwtService.sign({ sub: adminUser.id, correo: adminUser.correo, rol: 'ADMIN' });
    userToken = jwtService.sign({ sub: regularUser.id, correo: regularUser.correo, rol: 'USUARIO', companiaId: companyId });
  });

  afterAll(async () => {
    // Limpiar de forma selectiva los datos creados en los tests para no corromper la BD de desarrollo
    await prisma.employee.deleteMany({
      where: {
        companiaId: companyId,
      },
    });

    await prisma.user.deleteMany({
      where: {
        correo: { in: ['admin.emp.test@ejemplo.com', 'user.emp.test@ejemplo.com'] },
      },
    });

    await prisma.company.delete({
      where: {
        id: companyId,
      },
    });

    await app.close();
  });

  beforeEach(async () => {
    // Limpiar empleados del test antes de cada ejecución
    await prisma.employee.deleteMany({
      where: {
        companiaId: companyId,
      },
    });
    employeeIds = [];
  });

  describe('GET /api/empleados', () => {
    it('debería retornar listado paginado con la estructura envelope correcta', async () => {
      // Insertar 3 empleados de prueba
      const emp1 = await prisma.employee.create({
        data: {
          nombre: 'TEST_A',
          apellido: 'TEST_Perez',
          correo: 'test.a@ejemplo.com',
          cargo: 'Soporte',
          salario: 1000000,
          companiaId: companyId,
        },
      });
      const emp2 = await prisma.employee.create({
        data: {
          nombre: 'TEST_B',
          apellido: 'TEST_Alvarez',
          correo: 'test.b@ejemplo.com',
          cargo: 'Dev',
          salario: 2000000,
          companiaId: companyId,
        },
      });

      const response = await request(app.getHttpServer())
        .get('/api/empleados')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ pagina: 1, tamano: 1, orden: 'apellido', dir: 'asc', buscar: 'TEST_' })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('datos');
      expect(response.body).toHaveProperty('pagina', 1);
      expect(response.body).toHaveProperty('tamano', 1);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('totalPaginas');
      expect(response.body.datos).toHaveLength(1);
      
      // Debería ordenar por apellido ASC: Alvarez (TEST_B) va primero que Perez (TEST_A)
      expect(response.body.datos[0].nombre).toBe('TEST_B');
    });

    it('debería retornar 400 Bad Request si los parámetros de paginación son inválidos', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/empleados')
        .set('Authorization', `Bearer ${userToken}`)
        .query({ pagina: 0, tamano: 10 })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toHaveProperty('mensaje', 'Parámetros de consulta inválidos');
      expect(response.body).toHaveProperty('errores');
      expect(response.body.errores[0].campo).toBe('pagina');
    });
  });

  describe('POST /api/empleados/lote', () => {
    it('debería crear múltiples empleados en lote y responder 201', async () => {
      const loteDto = {
        empleados: [
          {
            nombre: 'TEST_Lote1',
            apellido: 'Uno',
            correo: 'lote1@ejemplo.com',
            cargo: 'Dev',
            salario: 3000000,
            companiaId: companyId,
          },
          {
            nombre: 'TEST_Lote2',
            apellido: 'Dos',
            correo: 'lote2@ejemplo.com',
            cargo: 'QA',
            salario: 2500000,
            companiaId: companyId,
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/api/empleados/lote')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(loteDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('mensaje', 'Creación masiva exitosa');
      expect(response.body).toHaveProperty('creados', 2);
      expect(response.body.empleados).toHaveLength(2);

      // Verificar en BD
      const enDb = await prisma.employee.findMany({
        where: { companiaId: companyId },
      });
      expect(enDb).toHaveLength(2);
    });

    it('debería fallar con 422 si hay datos inválidos en el lote (ej. salario negativo)', async () => {
      const loteInvalido = {
        empleados: [
          {
            nombre: 'TEST_Valido',
            apellido: 'Ok',
            correo: 'valido@ejemplo.com',
            cargo: 'Dev',
            salario: 3000000,
            companiaId: companyId,
          },
          {
            nombre: 'TEST_Invalido',
            apellido: 'NoOk',
            correo: 'invalido@ejemplo.com',
            cargo: 'QA',
            salario: -1000, // Inválido
            companiaId: companyId,
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/api/empleados/lote')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(loteInvalido)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      expect(response.body).toHaveProperty('mensaje', 'Error de validación');
      expect(response.body.errores[0].campo).toContain('empleados[1].salario');
    });
  });

  describe('PATCH /api/empleados/:id', () => {
    it('debería actualizar parcialmente un empleado', async () => {
      const emp = await prisma.employee.create({
        data: {
          nombre: 'TEST_Patch',
          apellido: 'Original',
          correo: 'patch@ejemplo.com',
          cargo: 'Dev',
          salario: 1000000,
          companiaId: companyId,
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/empleados/${emp.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ salario: 4500000 })
        .expect(HttpStatus.OK);

      expect(response.body.salario).toBe(4500000);
      expect(response.body.nombre).toBe('TEST_Patch'); // No cambió
    });
  });

  describe('DELETE /api/empleados/lote', () => {
    it('debería eliminar múltiples empleados y responder 204', async () => {
      const emp1 = await prisma.employee.create({
        data: {
          nombre: 'TEST_Del1',
          apellido: 'Uno',
          correo: 'del1@ejemplo.com',
          cargo: 'Dev',
          salario: 1000000,
          companiaId: companyId,
        },
      });
      const emp2 = await prisma.employee.create({
        data: {
          nombre: 'TEST_Del2',
          apellido: 'Dos',
          correo: 'del2@ejemplo.com',
          cargo: 'QA',
          salario: 2000000,
          companiaId: companyId,
        },
      });

      await request(app.getHttpServer())
        .delete('/api/empleados/lote')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: [emp1.id, emp2.id] })
        .expect(HttpStatus.NO_CONTENT);

      // Verificar en BD
      const enDb = await prisma.employee.findMany({
        where: { id: { in: [emp1.id, emp2.id] } },
      });
      expect(enDb).toHaveLength(0);
    });
  });

  describe('Políticas de Propiedad - Módulo 6 (EsPropietarioDeCompania)', () => {
    let otherCompanyId: number;
    let otherEmployeeId: number;
    let ownEmployeeId: number;

    beforeAll(async () => {
      // Crear otra compañía de prueba
      const otherCompany = await prisma.company.create({
        data: {
          nombre: 'OTHER_TEST_COMPANY',
          direccion: 'Avenida Siempre Viva 742',
          telefono: '7654321',
        },
      });
      otherCompanyId = otherCompany.id;

      // Crear un empleado de la otra compañía
      const otherEmployee = await prisma.employee.create({
        data: {
          nombre: 'Other',
          apellido: 'Employee',
          correo: 'other.employee@test.com',
          cargo: 'Analista',
          salario: 2000000,
          companiaId: otherCompanyId,
        },
      });
      otherEmployeeId = otherEmployee.id;
    });

    afterAll(async () => {
      // Limpiar los recursos creados en esta sección
      await prisma.employee.deleteMany({
        where: {
          id: { in: [otherEmployeeId, ownEmployeeId] },
        },
      });

      await prisma.company.delete({
        where: {
          id: otherCompanyId,
        },
      });
    });

    beforeEach(async () => {
      // Crear un empleado para la compañía propia antes de cada test para asegurar existencia
      const ownEmployee = await prisma.employee.create({
        data: {
          nombre: 'Own',
          apellido: 'Employee',
          correo: 'own.employee@test.com',
          cargo: 'Dev',
          salario: 3000000,
          companiaId: companyId,
        },
      });
      ownEmployeeId = ownEmployee.id;
    });

    afterEach(async () => {
      // Limpiar el empleado de la compañía propia
      await prisma.employee.deleteMany({
        where: {
          id: ownEmployeeId,
        },
      }).catch(() => {});
    });

    describe('Creación de Empleados (POST /api/empleados)', () => {
      it('debería permitir a un USUARIO crear un empleado en su propia compañía', async () => {
        const dto = {
          nombre: 'NuevoPropio',
          apellido: 'Emp',
          correo: 'nuevo.propio@test.com',
          cargo: 'Dev',
          salario: 2500000,
          companiaId: companyId,
        };

        const response = await request(app.getHttpServer())
          .post('/api/empleados')
          .set('Authorization', `Bearer ${userToken}`)
          .send(dto)
          .expect(HttpStatus.CREATED);

        expect(response.body).toHaveProperty('id');
        expect(response.body.nombre).toBe(dto.nombre);

        // Limpiar empleado creado
        await prisma.employee.delete({ where: { id: response.body.id } });
      });

      it('debería prohibir (403) a un USUARIO crear un empleado en otra compañía', async () => {
        const dto = {
          nombre: 'NuevoAjeno',
          apellido: 'Emp',
          correo: 'nuevo.ajeno@test.com',
          cargo: 'Dev',
          salario: 2500000,
          companiaId: otherCompanyId,
        };

        await request(app.getHttpServer())
          .post('/api/empleados')
          .set('Authorization', `Bearer ${userToken}`)
          .send(dto)
          .expect(HttpStatus.FORBIDDEN);
      });
    });

    describe('Actualización de Empleados (PUT/PATCH)', () => {
      it('debería permitir a un USUARIO actualizar un empleado de su propia compañía', async () => {
        await request(app.getHttpServer())
          .patch(`/api/empleados/${ownEmployeeId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ salario: 3500000 })
          .expect(HttpStatus.OK);

        const updated = await prisma.employee.findUnique({ where: { id: ownEmployeeId } });
        expect(updated?.salario).toBe(3500000);
      });

      it('debería prohibir (403) a un USUARIO actualizar un empleado de otra compañía', async () => {
        await request(app.getHttpServer())
          .patch(`/api/empleados/${otherEmployeeId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ salario: 3500000 })
          .expect(HttpStatus.FORBIDDEN);
      });

      it('debería prohibir (403) a un USUARIO transferir a su empleado a otra compañía', async () => {
        await request(app.getHttpServer())
          .patch(`/api/empleados/${ownEmployeeId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ companiaId: otherCompanyId })
          .expect(HttpStatus.FORBIDDEN);
      });

      it('debería permitir a un ADMIN actualizar un empleado de cualquier compañía', async () => {
        await request(app.getHttpServer())
          .patch(`/api/empleados/${otherEmployeeId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ salario: 4500000 })
          .expect(HttpStatus.OK);

        const updated = await prisma.employee.findUnique({ where: { id: otherEmployeeId } });
        expect(updated?.salario).toBe(4500000);
      });
    });

    describe('Eliminación de Empleados (DELETE)', () => {
      it('debería permitir a un USUARIO eliminar un empleado de su propia compañía', async () => {
        await request(app.getHttpServer())
          .delete(`/api/empleados/${ownEmployeeId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(HttpStatus.NO_CONTENT);

        const exists = await prisma.employee.findUnique({ where: { id: ownEmployeeId } });
        expect(exists).toBeNull();
      });

      it('debería prohibir (403) a un USUARIO eliminar un empleado de otra compañía', async () => {
        await request(app.getHttpServer())
          .delete(`/api/empleados/${otherEmployeeId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(HttpStatus.FORBIDDEN);
      });

      it('debería permitir a un ADMIN eliminar un empleado de cualquier compañía', async () => {
        await request(app.getHttpServer())
          .delete(`/api/empleados/${otherEmployeeId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(HttpStatus.NO_CONTENT);

        const exists = await prisma.employee.findUnique({ where: { id: otherEmployeeId } });
        expect(exists).toBeNull();
      });
    });
  });
});
