import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ICompanyRepository } from '../../domain/repositories/company.repository.interface';
import { Company } from '../../domain/entities/company.entity';

export class PrismaCompanyRepository implements ICompanyRepository {
  constructor(private prisma: Prisma.TransactionClient | PrismaService) {}

  async findAll(): Promise<Company[]> {
    return this.prisma.company.findMany();
  }

  async findById(id: number): Promise<Company | null> {
    return this.prisma.company.findUnique({ where: { id } });
  }

  async create(data: Omit<Company, 'id' | 'fechaCreacion'>): Promise<Company> {
    return this.prisma.company.create({
      data: {
        nombre: data.nombre,
        direccion: data.direccion,
        telefono: data.telefono,
      },
    });
  }

  async update(id: number, data: Partial<Company>): Promise<Company> {
    return this.prisma.company.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.company.delete({ where: { id } });
  }

  async findByCondition(condition: Partial<Company>): Promise<Company[]> {
    return this.prisma.company.findMany({ where: condition });
  }
}