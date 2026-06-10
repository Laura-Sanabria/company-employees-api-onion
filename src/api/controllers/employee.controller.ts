import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';
import { CityPolicyGuard } from '../guards/city-policy.guard';
import { getCityPolicy } from '../../domain/policies/city-policy.interface';
import * as bcrypt from 'bcryptjs';
import { CreateEmployeeDto } from '../../application/dtos/create-employee.dto';
import { PatchEmployeeDto } from '../../application/dtos/patch-employee.dto';

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeeController {
  constructor(private prisma: PrismaService) { }

  @Get()
  async findAll(@Request() req) {
    // Si es admin, ve todos los empleados
    if (req.user.rol === 'ADMIN') {
      return this.prisma.employee.findMany({
        include: {
          compania: {
            select: {
              id: true,
              nombre: true,
              ciudad: true,
            },
          },
        },
      });
    }

    // Si es empleado, solo ve los empleados de su empresa
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: { companiaId: true },
    });

    if (user?.companiaId) {
      return this.prisma.employee.findMany({
        where: { companiaId: user.companiaId },
        include: {
          compania: {
            select: {
              id: true,
              nombre: true,
              ciudad: true,
            },
          },
        },
      });
    }

    return [];
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: parseInt(id) },
      include: {
        compania: {
          select: {
            id: true,
            nombre: true,
            ciudad: true,
          },
        },
      },
    });

    if (!employee) {
      throw new ForbiddenException('Empleado no encontrado');
    }

    // Si es empleado, verificar que pertenezca a su empresa
    if (req.user.rol === 'EMPLEADO') {
      const user = await this.prisma.user.findUnique({
        where: { id: req.user.id },
        select: { companiaId: true },
      });

      if (user?.companiaId !== employee.companiaId) {
        throw new ForbiddenException('No tienes permiso para ver este empleado');
      }
    }

    return employee;
  }

  @Post()
  @Roles('ADMIN')
  @UseGuards(RolesGuard, CityPolicyGuard)
  async create(@Body() createEmployeeDto: CreateEmployeeDto, @Request() req) {
    const userCity = req.user.ciudad;
    const policy = getCityPolicy(userCity);

    if (!policy.canCreate) {
      throw new ForbiddenException(`Los admins de ${userCity} no pueden crear empleados`);
    }

    return this.prisma.employee.create({
      data: createEmployeeDto,
      include: {
        compania: {
          select: {
            id: true,
            nombre: true,
            ciudad: true,
          },
        },
      },
    });
  }

  @Put(':id')
  @Roles('ADMIN')
  @UseGuards(RolesGuard, CityPolicyGuard)
  async update(@Param('id') id: string, @Body() updateEmployeeDto: CreateEmployeeDto, @Request() req) {
    const userCity = req.user.ciudad;
    const policy = getCityPolicy(userCity);

    if (!policy.canUpdate) {
      throw new ForbiddenException(`Los admins de ${userCity} no pueden actualizar empleados`);
    }

    return this.prisma.employee.update({
      where: { id: parseInt(id) },
      data: updateEmployeeDto,
      include: {
        compania: {
          select: {
            id: true,
            nombre: true,
            ciudad: true,
          },
        },
      },
    });
  }

  @Patch(':id')
  @Roles('ADMIN')
  @UseGuards(RolesGuard, CityPolicyGuard)
  async patch(@Param('id') id: string, @Body() patchEmployeeDto: PatchEmployeeDto, @Request() req) {
    const userCity = req.user.ciudad;
    const policy = getCityPolicy(userCity);

    if (!policy.canPatch) {
      throw new ForbiddenException(
        `Los admins de ${userCity} no pueden hacer PATCH, use PUT para actualización completa`,
      );
    }

    return this.prisma.employee.update({
      where: { id: parseInt(id) },
      data: patchEmployeeDto,
      include: {
        compania: {
          select: {
            id: true,
            nombre: true,
            ciudad: true,
          },
        },
      },
    });
  }

  @Delete(':id')
  @Roles('ADMIN')
  @UseGuards(RolesGuard, CityPolicyGuard)
  async remove(@Param('id') id: string, @Request() req) {
    const userCity = req.user.ciudad;
    const policy = getCityPolicy(userCity);

    if (!policy.canDelete) {
      throw new ForbiddenException(`Los admins de ${userCity} no pueden eliminar empleados`);
    }

    return this.prisma.employee.delete({
      where: { id: parseInt(id) },
    });
  }
}