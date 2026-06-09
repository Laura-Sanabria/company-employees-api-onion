import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UnitOfWork } from '../../shared/unit-of-work/unit-of-work.service';
import { RegisterDto, LoginDto } from '../dtos/auth.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly jwtService: JwtService,
  ) {}

  async registro(dto: RegisterDto) {
    return this.uow.executeTransaction(async (tx) => {
      // 1. Validar correo único
      const existing = await tx.users.findByEmail(dto.correo);
      if (existing) {
        throw new ConflictException(`El correo ${dto.correo} ya está registrado`);
      }

      // 2. Si se especifica compañía, validar existencia
      if (dto.companiaId) {
        const company = await tx.companies.findById(dto.companiaId);
        if (!company) {
          throw new NotFoundException(`La compañía con ID ${dto.companiaId} no existe`);
        }
      }

      // 3. Hashear la contraseña
      const salt = await bcrypt.genSalt(10);
      const contrasenaHash = await bcrypt.hash(dto.contrasena, salt);

      // 4. Crear el usuario
      const user = await tx.users.create({
        nombre: dto.nombre,
        correo: dto.correo,
        contrasenaHash,
        rol: dto.rol ?? 'USUARIO',
        companiaId: dto.companiaId ?? null,
      });

      // 5. Retornar los datos (sin la contraseña)
      const { contrasenaHash: _, ...result } = user;
      return result;
    });
  }

  async login(dto: LoginDto) {
    return this.uow.executeTransaction(async (tx) => {
      // 1. Buscar usuario
      const user = await tx.users.findByEmail(dto.correo);
      if (!user) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      // 2. Validar contraseña
      const isMatch = await bcrypt.compare(dto.contrasena, user.contrasenaHash);
      if (!isMatch) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      // 3. Generar JWT con los claims requeridos
      const payload = {
        sub: user.id,
        correo: user.correo,
        rol: user.rol,
        companiaId: user.companiaId,
      };

      return {
        access_token: this.jwtService.sign(payload),
        usuario: {
          id: user.id,
          nombre: user.nombre,
          correo: user.correo,
          rol: user.rol,
          companiaId: user.companiaId,
        },
      };
    });
  }

  async obtenerUsuarioPorId(id: number) {
    return this.uow.executeTransaction(async (tx) => {
      const user = await tx.users.findById(id);
      if (!user) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      }

      const { contrasenaHash: _, ...result } = user;
      return result;
    });
  }
}
