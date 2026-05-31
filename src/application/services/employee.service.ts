import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { UnitOfWork } from '../../shared/unit-of-work/unit-of-work.service';
import { CreateEmployeeDto } from '../dtos/create-employee.dto';
import { UpdateEmployeeDto } from '../dtos/update-employee.dto';
import { PatchEmployeeDto } from '../dtos/patch-employee.dto';
import { BulkCreateEmployeesDto } from '../dtos/bulk-create-employees.dto';
import { BulkDeleteEmployeesDto } from '../dtos/bulk-delete-employees.dto';
import { EmployeeListQueryDto } from '../dtos/employee-list-query.dto';
import { PagedQuery } from '../../domain/dtos/pagination.dto';

@Injectable()
export class EmployeeService {
  constructor(private readonly uow: UnitOfWork) {}

  async findPaged(query: EmployeeListQueryDto) {
    const pagedQuery: PagedQuery = {
      pagina: query.pagina,
      tamano: query.tamano,
      orden: query.orden,
      dir: query.dir,
      buscar: query.buscar,
    };

    return this.uow.executeTransaction(async (tx) => {
      return tx.employees.getPaged(pagedQuery);
    });
  }

  async findById(id: number) {
    return this.uow.executeTransaction(async (tx) => {
      const employee = await tx.employees.findById(id);
      if (!employee) {
        throw new NotFoundException(`Empleado con ID ${id} no encontrado`);
      }
      return employee;
    });
  }

  async create(createEmployeeDto: CreateEmployeeDto) {
    return this.uow.executeTransaction(async (tx) => {
      await this.ensureCompanyExists(tx, createEmployeeDto.companiaId);

      const existing = await tx.employees.findByEmail(createEmployeeDto.correo);
      if (existing) {
        throw new UnprocessableEntityException({
          mensaje: 'Error de validación',
          errores: [{ campo: 'correo', detalle: `El correo ${createEmployeeDto.correo} ya está registrado` }],
        });
      }

      return tx.employees.create(createEmployeeDto);
    });
  }

  async createBulk(dto: BulkCreateEmployeesDto) {
    return this.uow.executeTransaction(async (tx) => {
      // 1. Validar que no haya correos duplicados en el lote enviado
      const emails = dto.empleados.map((e) => e.correo);
      const duplicateInBatch = emails.filter((item, index) => emails.indexOf(item) !== index);
      if (duplicateInBatch.length > 0) {
        throw new UnprocessableEntityException({
          mensaje: 'Error de validación',
          errores: [{ campo: 'correo', detalle: `El lote contiene correos duplicados: ${[...new Set(duplicateInBatch)].join(', ')}` }],
        });
      }

      // 2. Validar que ninguna compañía en el lote no exista
      const companyIds = [...new Set(dto.empleados.map((e) => e.companiaId))];
      for (const companyId of companyIds) {
        await this.ensureCompanyExists(tx, companyId);
      }

      // 3. Validar contra la BD que los correos no existan previamente
      for (const emp of dto.empleados) {
        const existing = await tx.employees.findByEmail(emp.correo);
        if (existing) {
          throw new UnprocessableEntityException({
            mensaje: 'Error de validación',
            errores: [{ campo: 'correo', detalle: `El correo ${emp.correo} ya está registrado` }],
          });
        }
      }

      return tx.employees.createRange(dto.empleados);
    });
  }

  async update(id: number, updateEmployeeDto: UpdateEmployeeDto) {
    return this.uow.executeTransaction(async (tx) => {
      const current = (await this.ensureEmployeeExists(tx, id)) as any;

      if (updateEmployeeDto.companiaId) {
        await this.ensureCompanyExists(tx, updateEmployeeDto.companiaId);
      }

      if (updateEmployeeDto.correo && updateEmployeeDto.correo !== current.correo) {
        const existing = await tx.employees.findByEmail(updateEmployeeDto.correo);
        if (existing) {
          throw new UnprocessableEntityException({
            mensaje: 'Error de validación',
            errores: [{ campo: 'correo', detalle: `El correo ${updateEmployeeDto.correo} ya está registrado` }],
          });
        }
      }

      return tx.employees.update(id, updateEmployeeDto);
    });
  }

  async patch(id: number, patchEmployeeDto: PatchEmployeeDto) {
    return this.uow.executeTransaction(async (tx) => {
      const current = (await this.ensureEmployeeExists(tx, id)) as any;

      if (patchEmployeeDto.companiaId) {
        await this.ensureCompanyExists(tx, patchEmployeeDto.companiaId);
      }

      if (patchEmployeeDto.correo && patchEmployeeDto.correo !== current.correo) {
        const existing = await tx.employees.findByEmail(patchEmployeeDto.correo);
        if (existing) {
          throw new UnprocessableEntityException({
            mensaje: 'Error de validación',
            errores: [{ campo: 'correo', detalle: `El correo ${patchEmployeeDto.correo} ya está registrado` }],
          });
        }
      }

      return tx.employees.patchPartial(id, patchEmployeeDto);
    });
  }

  async delete(id: number) {
    return this.uow.executeTransaction(async (tx) => {
      await this.ensureEmployeeExists(tx, id);
      await tx.employees.delete(id);
    });
  }

  async deleteBulk(dto: BulkDeleteEmployeesDto) {
    return this.uow.executeTransaction(async (tx) => {
      const uniqueIds = [...new Set(dto.ids)];
      const found = await tx.employees.countByIds(uniqueIds);

      if (found !== uniqueIds.length) {
        throw new NotFoundException(
          'Uno o más empleados de la lista no existen',
        );
      }

      await tx.employees.deleteRange(uniqueIds);
    });
  }

  private async ensureEmployeeExists(
    tx: { employees: { findById: (id: number) => Promise<unknown> } },
    id: number,
  ) {
    const employee = await tx.employees.findById(id);
    if (!employee) {
      throw new NotFoundException(`Empleado con ID ${id} no encontrado`);
    }
  }

  private async ensureCompanyExists(
    tx: { companies: { findById: (id: number) => Promise<unknown> } },
    companyId: number,
  ) {
    const company = await tx.companies.findById(companyId);
    if (!company) {
      throw new NotFoundException(
        `Compañía con ID ${companyId} no encontrada`,
      );
    }
  }
}
