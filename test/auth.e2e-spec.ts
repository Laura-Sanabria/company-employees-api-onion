import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe, BadRequestException, UnprocessableEntityException } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { PrismaExceptionFilter } from '../src/api/filters/prisma-exception.filter';
import { formatValidationErrors } from '../src/api/pipes/validation.util';

describe('AuthController (Integración/E2E Auth)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
  });

  afterAll(async () => {
    // Limpiar usuarios creados en las pruebas
    await prisma.user.deleteMany({
      where: {
        correo: {
          in: ['registro.test@ejemplo.com', 'login.test@ejemplo.com'],
        },
      },
    });

    await app.close();
  });

  describe('POST /api/auth/registro', () => {
    it('debería registrar un usuario con éxito y retornar sus datos sin contraseña', async () => {
      const dto = {
        nombre: 'Registro Test',
        correo: 'registro.test@ejemplo.com',
        contrasena: 'password123',
        rol: 'USUARIO',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/registro')
        .send(dto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('nombre', dto.nombre);
      expect(response.body).toHaveProperty('correo', dto.correo);
      expect(response.body).toHaveProperty('rol', dto.rol);
      expect(response.body).not.toHaveProperty('contrasenaHash');
    });

    it('debería fallar con 409 si el correo ya está registrado', async () => {
      const dto = {
        nombre: 'Registro Duplicado',
        correo: 'registro.test@ejemplo.com', // Ya registrado en el test anterior
        contrasena: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/registro')
        .send(dto)
        .expect(HttpStatus.CONFLICT);

      expect(response.body.message).toContain('ya está registrado');
    });

    it('debería fallar con 422 si los datos del DTO son inválidos', async () => {
      const dtoInvalido = {
        nombre: '',
        correo: 'correo-invalido',
        contrasena: '123', // Menor a 6 caracteres
      };

      const response = await request(app.getHttpServer())
        .post('/api/auth/registro')
        .send(dtoInvalido)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY);

      expect(response.body).toHaveProperty('mensaje', 'Error de validación');
      expect(response.body.errores).toHaveLength(3);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Registrar un usuario específico para el login test (usando HTTP para probar todo el flujo)
      await request(app.getHttpServer())
        .post('/api/auth/registro')
        .send({
          nombre: 'Login Test User',
          correo: 'login.test@ejemplo.com',
          contrasena: 'segura123',
          rol: 'ADMIN',
        });
    });

    it('debería autenticar al usuario y retornar un access_token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          correo: 'login.test@ejemplo.com',
          contrasena: 'segura123',
        })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('usuario');
      expect(response.body.usuario).toHaveProperty('rol', 'ADMIN');
    });

    it('debería fallar con 401 si las credenciales son incorrectas', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          correo: 'login.test@ejemplo.com',
          contrasena: 'incorrecta',
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /api/auth/perfil', () => {
    let token: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          correo: 'login.test@ejemplo.com',
          contrasena: 'segura123',
        });
      token = response.body.access_token;
    });

    it('debería retornar los datos del perfil si se envía un token JWT válido', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/perfil')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('correo', 'login.test@ejemplo.com');
      expect(response.body).toHaveProperty('rol', 'ADMIN');
      expect(response.body).not.toHaveProperty('contrasenaHash');
    });

    it('debería denegar el acceso con 401 si no se envía token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/perfil')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
