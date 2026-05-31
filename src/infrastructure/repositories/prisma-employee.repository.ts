import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IEmployeeRepository } from '../../domain/repositories/employee.repository.interface';
import { Employee } from '../../domain/entities/employee.entity';
import {
  EMPLOYEE_SORT_FIELDS,
  EmployeeSortField,
  PagedQuery,
  PagedResult,
} from '../../domain/dtos/pagination.dto';

export class PrismaEmployeeRepository implements IEmployeeRepository {
  constructor(private prisma: Prisma.TransactionClient | PrismaService) {}

  async findAll(): Promise<Employee[]> {
    return this.prisma.employee.findMany();
  }

  async findById(id: number): Promise<Employee | null> {
    return this.prisma.employee.findUnique({ where: { id } });
  }

  async create(data: Omit<Employee, 'id'>): Promise<Employee> {
    return this.prisma.employee.create({
      data: {
        nombre: data.nombre,
        apellido: data.apellido,
        correo: data.correo,
        cargo: data.cargo,
        salario: data.salario,
        companiaId: data.companiaId,
      },
    });
  }

  async update(id: number, data: Partial<Employee>): Promise<Employee> {
    return this.prisma.employee.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.employee.delete({ where: { id } });
  }

  async findByCompanyId(companyId: number): Promise<Employee[]> {
    return this.prisma.employee.findMany({ where: { companiaId: companyId } });
  }

  async findByEmail(email: string): Promise<Employee | null> {
    return this.prisma.employee.findUnique({ where: { correo: email } });
  }

  async createRange(data: Omit<Employee, 'id'>[]): Promise<Employee[]> {
    const created: Employee[] = [];
    for (const item of data) {
      created.push(await this.create(item));
    }
    return created;
  }

  async patchPartial(id: number, data: Partial<Employee>): Promise<Employee> {
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    ) as Partial<Employee>;

    return this.prisma.employee.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteRange(ids: number[]): Promise<void> {
    await this.prisma.employee.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async countByIds(ids: number[]): Promise<number> {
    return this.prisma.employee.count({
      where: { id: { in: ids } },
    });
  }

  async getPaged(query: PagedQuery): Promise<PagedResult<Employee>> {
    const where = this.buildSearchFilter(query.buscar);
    const orderBy = this.buildOrderBy(query.orden, query.dir);
    const skip = (query.pagina - 1) * query.tamano;

    const [datos, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        orderBy,
        skip,
        take: query.tamano,
      }),
      this.prisma.employee.count({ where }),
    ]);

    return this.toPagedResult(datos, query.pagina, query.tamano, total);
  }

  async getByCompanyPaged(
    companyId: number,
    query: Pick<PagedQuery, 'pagina' | 'tamano'>,
  ): Promise<PagedResult<Employee>> {
    const where: Prisma.EmployeeWhereInput = { companiaId: companyId };
    const skip = (query.pagina - 1) * query.tamano;

    const [datos, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        orderBy: { apellido: 'asc' },
        skip,
        take: query.tamano,
      }),
      this.prisma.employee.count({ where }),
    ]);

    return this.toPagedResult(datos, query.pagina, query.tamano, total);
  }

  private buildSearchFilter(buscar?: string): Prisma.EmployeeWhereInput | undefined {
    if (!buscar?.trim()) {
      return undefined;
    }

    const term = buscar.trim();
    return {
      OR: [
        { nombre: { contains: term } },
        { apellido: { contains: term } },
        { correo: { contains: term } },
      ],
    };
  }

  private buildOrderBy(
    orden?: string,
    dir?: 'asc' | 'desc',
  ): Prisma.EmployeeOrderByWithRelationInput {
    const field: EmployeeSortField = EMPLOYEE_SORT_FIELDS.includes(
      orden as EmployeeSortField,
    )
      ? (orden as EmployeeSortField)
      : 'apellido';
    const direction = dir === 'desc' ? 'desc' : 'asc';

    return { [field]: direction };
  }

  private toPagedResult(
    datos: Employee[],
    pagina: number,
    tamano: number,
    total: number,
  ): PagedResult<Employee> {
    return {
      datos,
      pagina,
      tamano,
      total,
      totalPaginas: Math.ceil(total / tamano) || 0,
    };
  }
}
