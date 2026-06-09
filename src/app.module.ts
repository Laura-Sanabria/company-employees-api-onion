import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { AuthController } from './api/controllers/auth.controller';
import { CompanyController } from './api/controllers/company.controller';
import { EmployeeController } from './api/controllers/employee.controller';
import { JwtStrategy } from './api/guards/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [AuthController, CompanyController, EmployeeController],
  providers: [PrismaService, JwtStrategy],
})
export class AppModule { }