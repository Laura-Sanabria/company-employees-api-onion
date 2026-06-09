import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';

export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: Prisma.TransactionClient | PrismaService) {}

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { correo: email } });
  }

  async create(data: Omit<User, 'id' | 'fechaCreacion'>): Promise<User> {
    return this.prisma.user.create({
      data: {
        nombre: data.nombre,
        correo: data.correo,
        contrasenaHash: data.contrasenaHash,
        rol: data.rol,
        companiaId: data.companiaId,
      },
    });
  }
}
