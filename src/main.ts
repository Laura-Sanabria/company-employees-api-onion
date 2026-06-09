import 'dotenv/config';
import {
  BadRequestException,
  ValidationPipe,
  UnprocessableEntityException,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './api/filters/prisma-exception.filter';
import { formatValidationErrors } from './api/pipes/validation.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      exceptionFactory: (errors) => {
        const errores = formatValidationErrors(errors);
        const queryFields = new Set(['pagina', 'tamano', 'orden', 'dir', 'buscar']);
        const soloQueryParams =
          errors.length > 0 && errors.every((e) => queryFields.has(e.property));

        if (soloQueryParams) {
          return new BadRequestException({
            mensaje: 'Parámetros de consulta inválidos',
            errores,
          });
        }

        return new UnprocessableEntityException({
          mensaje: 'Error de validación',
          errores,
        });
      },
    }),
  );

  app.useGlobalFilters(new PrismaExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
