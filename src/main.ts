import 'dotenv/config';
import { ValidationPipe, UnprocessableEntityException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './api/filters/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      exceptionFactory: (errors) => {
        const formatError = (error: any, parentPath = ''): any[] => {
          const property = error.property;
          let path = parentPath;
          if (parentPath) {
            path = /^\d+$/.test(property) ? `${parentPath}[${property}]` : `${parentPath}.${property}`;
          } else {
            path = property;
          }

          const list: any[] = [];
          if (error.constraints) {
            Object.values(error.constraints).forEach((detail: string) => {
              list.push({
                campo: path,
                detalle: detail,
              });
            });
          }

          if (error.children && error.children.length > 0) {
            error.children.forEach((child: any) => {
              list.push(...formatError(child, path));
            });
          }

          return list;
        };

        const formattedErrors = errors.flatMap((err) => formatError(err));

        return new UnprocessableEntityException({
          mensaje: 'Error de validación',
          errores: formattedErrors,
        });
      },
    }),
  );

  app.useGlobalFilters(new PrismaExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
