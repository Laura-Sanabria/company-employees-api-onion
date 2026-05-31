import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { UnitOfWork } from '../../shared/unit-of-work/unit-of-work.service';
import { CreateCompanyDto } from '../dtos/create-company.dto';
import { UpdateCompanyDto } from '../dtos/update-company.dto';
import { CreateCompanyWithEmployeesDto } from '../dtos/create-company-with-employees.dto';

@Injectable()
export class CompanyService {
  constructor(private readonly uow: UnitOfWork) {}

  async findAll() {
    return this.uow.executeTransaction(async (tx) => {
      return tx.companies.findAll();
    });
  }

  async findById(id: number) {
    return this.uow.executeTransaction(async (tx) => {
      const company = await tx.companies.findById(id);
      if (!company) {
        throw new NotFoundException(`Compañía con ID ${id} no encontrada`);
      }
      return company;
    });
  }

  async create(createCompanyDto: CreateCompanyDto) {
    return this.uow.executeTransaction(async (tx) => {
      return tx.companies.create(createCompanyDto);
    });
  }

  async update(id: number, updateCompanyDto: UpdateCompanyDto) {
    return this.uow.executeTransaction(async (tx) => {
      await this.ensureCompanyExists(tx, id);
      return tx.companies.update(id, updateCompanyDto);
    });
  }

  async delete(id: number) {
    return this.uow.executeTransaction(async (tx) => {
      await this.ensureCompanyExists(tx, id);
      await tx.companies.delete(id);
    });
  }

  // ENDPOINT TRANSACCIONAL OBLIGATORIO
  async createWithEmployees(createDto: CreateCompanyWithEmployeesDto) {
    return this.uow.executeTransaction(async (tx) => {
      // 1. Validar duplicados de correo en el lote enviado
      const emails = createDto.empleados.map((e) => e.correo);
      const duplicateInBatch = emails.filter((item, index) => emails.indexOf(item) !== index);
      if (duplicateInBatch.length > 0) {
        throw new UnprocessableEntityException({
          mensaje: 'Error de validación',
          errores: [{ campo: 'correo', detalle: `El lote contiene correos duplicados: ${[...new Set(duplicateInBatch)].join(', ')}` }],
        });
      }

      // 2. Validar contra la BD que los correos no existan previamente
      for (const empDto of createDto.empleados) {
        const existing = await tx.employees.findByEmail(empDto.correo);
        if (existing) {
          throw new UnprocessableEntityException({
            mensaje: 'Error de validación',
            errores: [{ campo: 'correo', detalle: `El correo ${empDto.correo} ya está registrado` }],
          });
        }
      }

      // 3. Crear la compañía
      const company = await tx.companies.create({
        nombre: createDto.nombre,
        direccion: createDto.direccion,
        telefono: createDto.telefono,
      });

      // 4. Crear todos los empleados (si uno falla, no se guarda nada)
      for (const empDto of createDto.empleados) {
        await tx.employees.create({
          nombre: empDto.nombre,
          apellido: empDto.apellido,
          correo: empDto.correo,
          cargo: empDto.cargo,
          salario: empDto.salario,
          companiaId: company.id,
        });
      }

      // 3. Retornar la compañía con sus empleados
      return {
        ...company,
        empleados: await tx.employees.findByCompanyId(company.id),
      };
    });
  }

  async getEmployeesByCompany(
    companyId: number,
    query: { pagina: number; tamano: number },
  ) {
    return this.uow.executeTransaction(async (tx) => {
      await this.ensureCompanyExists(tx, companyId);
      return tx.employees.getByCompanyPaged(companyId, query);
    });
  }

  private async ensureCompanyExists(
    tx: { companies: { findById: (id: number) => Promise<unknown> } },
    id: number,
  ) {
    const company = await tx.companies.findById(id);
    if (!company) {
      throw new NotFoundException(`Compañía con ID ${id} no encontrada`);
    }
  }
}