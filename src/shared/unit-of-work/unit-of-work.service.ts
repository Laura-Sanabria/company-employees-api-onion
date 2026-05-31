import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PrismaCompanyRepository } from '../../infrastructure/repositories/prisma-company.repository';
import { PrismaEmployeeRepository } from '../../infrastructure/repositories/prisma-employee.repository';

@Injectable()
export class UnitOfWork {
  constructor(private prisma: PrismaService) {}

  async executeTransaction<T>(fn: (uow: TransactionUnit) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (prisma) => {
      const companyRepo = new PrismaCompanyRepository(prisma);
      const employeeRepo = new PrismaEmployeeRepository(prisma);
      
      const unit = new TransactionUnit(companyRepo, employeeRepo);
      return fn(unit);
    });
  }
}

export class TransactionUnit {
  constructor(
    public readonly companies: PrismaCompanyRepository,
    public readonly employees: PrismaEmployeeRepository,
  ) {}
}