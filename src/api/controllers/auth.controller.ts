import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Controller('auth')
export class AuthController {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) { }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: { correo: string; contrasena: string }) {
    const { correo, contrasena } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { correo },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const isPasswordValid = await bcrypt.compare(contrasena, user.contrasenaHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    const payload = {
      sub: user.id,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.rol,
      ciudad: user.ciudad,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol,
        ciudad: user.ciudad,
      },
    };
  }

  @Post('seed')
  @HttpCode(HttpStatus.CREATED)
  async seedDatabase() {
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Verificar si ya existen usuarios
    const existingUsers = await this.prisma.user.count();
    if (existingUsers > 0) {
      return { message: 'La base de datos ya tiene datos, no se ejecutó el seed' };
    }

    // Crear admins de Medellín
    await this.prisma.user.createMany({
      data: [
        {
          nombre: 'Juan Pérez',
          correo: 'juan.medellin@empresa.com',
          contrasenaHash: hashedPassword,
          rol: 'ADMIN',
          ciudad: 'medellin',
        },
        {
          nombre: 'María García',
          correo: 'maria.medellin@empresa.com',
          contrasenaHash: hashedPassword,
          rol: 'ADMIN',
          ciudad: 'medellin',
        },
      ],
    });

    // Crear admins de Bogotá
    await this.prisma.user.createMany({
      data: [
        {
          nombre: 'Carlos Rodríguez',
          correo: 'carlos.bogota@empresa.com',
          contrasenaHash: hashedPassword,
          rol: 'ADMIN',
          ciudad: 'bogota',
        },
        {
          nombre: 'Andrea Martínez',
          correo: 'andrea.bogota@empresa.com',
          contrasenaHash: hashedPassword,
          rol: 'ADMIN',
          ciudad: 'bogota',
        },
      ],
    });

    // Crear empresas
    await this.prisma.company.createMany({
      data: [
        {
          nombre: 'Tecnología Medellín SAS',
          direccion: 'Calle 50 #45-67',
          telefono: '6041234567',
          ciudad: 'medellin',
        },
        {
          nombre: 'Bogotá Business Group',
          direccion: 'Carrera 15 #88-90',
          telefono: '6019876543',
          ciudad: 'bogota',
        },
        {
          nombre: 'Innovación Colombia',
          direccion: 'Cra 42 #20-30',
          telefono: '6047654321',
          ciudad: 'medellin',
        },
      ],
    });

    // Crear empleados
    await this.prisma.user.createMany({
      data: [
        { nombre: 'Pedro López', correo: 'pedro@empresa.com', contrasenaHash: hashedPassword, rol: 'EMPLEADO', ciudad: 'medellin' },
        { nombre: 'Laura Fernández', correo: 'laura@empresa.com', contrasenaHash: hashedPassword, rol: 'EMPLEADO', ciudad: 'bogota' },
        { nombre: 'Rafael Sánchez', correo: 'rafael@empresa.com', contrasenaHash: hashedPassword, rol: 'EMPLEADO', ciudad: 'medellin' },
        { nombre: 'Sofía Ramírez', correo: 'sofia@empresa.com', contrasenaHash: hashedPassword, rol: 'EMPLEADO', ciudad: 'bogota' },
        { nombre: 'Diego Torres', correo: 'diego@empresa.com', contrasenaHash: hashedPassword, rol: 'EMPLEADO', ciudad: 'bogota' },
        { nombre: 'Carmen Ruiz', correo: 'carmen@empresa.com', contrasenaHash: hashedPassword, rol: 'EMPLEADO', ciudad: 'medellin' },
      ],
    });

    return {
      message: 'Base de datos seedeada exitosamente',
      credentials: {
        adminMedellin: 'juan.medellin@empresa.com / password123',
        adminBogota: 'carlos.bogota@empresa.com / password123',
        employee: 'pedro@empresa.com / password123',
      },
    };
  }
}