import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Unique constraint violation
    if (exception.code === 'P2002') {
      let field = 'campo';
      const target = exception.meta?.target;
      if (Array.isArray(target)) {
        field = target.join(', ');
      } else if (typeof target === 'string') {
        field = target;
      }

      return response.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
        mensaje: 'Error de validación',
        errores: [
          {
            campo: field,
            detalle: 'El valor ya está registrado (restricción única)',
          },
        ],
      });
    }

    // Default error response for other Prisma errors
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Error interno en la base de datos',
    });
  }
}
