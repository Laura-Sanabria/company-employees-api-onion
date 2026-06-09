import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { cityPolicies } from '../../domain/policies/city-policy.interface';

@Injectable()
export class CityPolicyGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const method = request.method;

        // Solo aplica políticas a admins
        if (!user || user.rol !== 'ADMIN') {
            return true;
        }

        const policy = cityPolicies[user.ciudad];
        if (!policy) {
            throw new ForbiddenException(`No hay políticas definidas para la ciudad ${user.ciudad}`);
        }

        // Verificar según el método HTTP
        if (method === 'DELETE' && !policy.canDelete) {
            throw new ForbiddenException(
                `Los administradores de ${user.ciudad} no tienen permiso para eliminar registros`,
            );
        }

        if (method === 'PATCH' && !policy.canPatch) {
            throw new ForbiddenException(
                `Los administradores de ${user.ciudad} no pueden hacer PATCH, use PUT para actualización completa`,
            );
        }

        if (method === 'POST' && !policy.canCreate) {
            throw new ForbiddenException(
                `Los administradores de ${user.ciudad} no tienen permiso para crear registros`,
            );
        }

        return true;
    }
}