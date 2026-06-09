import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UnitOfWork } from '../../shared/unit-of-work/unit-of-work.service';

@Injectable()
export class EmployeeOwnershipGuard implements CanActivate {
  constructor(private readonly uow: UnitOfWork) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { user, method, params, body } = request;

    if (!user) {
      throw new ForbiddenException('Acceso denegado: Usuario no autenticado');
    }

    // El administrador tiene bypass total
    if (user.rol === 'ADMIN') {
      return true;
    }

    // Restricciones para el rol USUARIO
    if (user.rol === 'USUARIO') {
      // 1. Creación (POST)
      if (method === 'POST') {
        const targetCompanyId = body.companiaId;
        if (!targetCompanyId) {
          return true; // Deja que class-validator maneje la obligatoriedad
        }
        if (targetCompanyId !== user.companiaId) {
          throw new ForbiddenException(
            `Acceso denegado: No puedes asociar un empleado a una compañía diferente a la tuya (ID ${user.companiaId})`,
          );
        }
        return true;
      }

      // 2. Modificación, eliminación o lectura individual (PUT, PATCH, DELETE, GET)
      if (['PUT', 'PATCH', 'DELETE', 'GET'].includes(method)) {
        const employeeId = params.id ? parseInt(params.id, 10) : null;
        if (!employeeId || isNaN(employeeId)) {
          return true;
        }

        // Consultar el empleado para verificar la compañía a la que pertenece
        const employee = await this.uow.executeTransaction(async (tx) => {
          return tx.employees.findById(employeeId);
        });

        if (!employee) {
          throw new NotFoundException(`Empleado con ID ${employeeId} no encontrado`);
        }

        if (employee.companiaId !== user.companiaId) {
          throw new ForbiddenException(
            'Acceso denegado: No tienes permisos sobre los recursos de otra compañía',
          );
        }

        // Impedir cambiar la compañía del empleado a una que no sea la del usuario
        if (['PUT', 'PATCH'].includes(method) && body.companiaId) {
          if (body.companiaId !== user.companiaId) {
            throw new ForbiddenException(
              `Acceso denegado: No puedes mover un empleado a otra compañía (ID ${body.companiaId})`,
            );
          }
        }

        return true;
      }
    }

    return true;
  }
}
