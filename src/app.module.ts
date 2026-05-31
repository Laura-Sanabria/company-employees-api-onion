import { Module } from '@nestjs/common';
import { CompanyController } from './api/controllers/company.controller';
import { EmployeeController } from './api/controllers/employee.controller';
import { CompanyService } from './application/services/company.service';
import { EmployeeService } from './application/services/employee.service';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { UnitOfWork } from './shared/unit-of-work/unit-of-work.service';

@Module({
  controllers: [CompanyController, EmployeeController],
  providers: [CompanyService, EmployeeService, PrismaService, UnitOfWork],
})
export class AppModule {}