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

@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompanyController {
  constructor(private prisma: PrismaService) { }

  @Get()
  @Roles('ADMIN')
  async findAll() {
    return this.prisma.company.findMany({
      include: {
        usuarios: {
          select: {
            id: true,
            nombre: true,
            correo: true,
            rol: true,
            ciudad: true,
          },
        },
        empleados: true,
      },
    });
  }

  @Get(':id')
  @Roles('ADMIN')
  async findOne(@Param('id') id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuarios: {
          select: {
            id: true,
            nombre: true,
            correo: true,
            rol: true,
            ciudad: true,
          },
        },
        empleados: true,
      },
    });

    if (!company) {
      throw new ForbiddenException('Empresa no encontrada');
    }

    return company;
  }

  @Post()
  @Roles('ADMIN')
  @UseGuards(CityPolicyGuard)
  async create(@Body() createCompanyDto: any, @Request() req) {
    const userCity = req.user.ciudad;
    const policy = getCityPolicy(userCity);

    if (!policy.canCreate) {
      throw new ForbiddenException(`Los admins de ${userCity} no pueden crear empresas`);
    }

    return this.prisma.company.create({
      data: createCompanyDto,
    });
  }

  @Put(':id')
  @Roles('ADMIN')
  @UseGuards(CityPolicyGuard)
  async update(@Param('id') id: string, @Body() updateCompanyDto: any, @Request() req) {
    const userCity = req.user.ciudad;
    const policy = getCityPolicy(userCity);

    if (!policy.canUpdate) {
      throw new ForbiddenException(`Los admins de ${userCity} no pueden actualizar empresas`);
    }

    return this.prisma.company.update({
      where: { id: parseInt(id) },
      data: updateCompanyDto,
    });
  }

  @Patch(':id')
  @Roles('ADMIN')
  @UseGuards(CityPolicyGuard)
  async patch(@Param('id') id: string, @Body() patchCompanyDto: any, @Request() req) {
    const userCity = req.user.ciudad;
    const policy = getCityPolicy(userCity);

    if (!policy.canPatch) {
      throw new ForbiddenException(
        `Los admins de ${userCity} no pueden hacer PATCH, use PUT para actualización completa`,
      );
    }

    return this.prisma.company.update({
      where: { id: parseInt(id) },
      data: patchCompanyDto,
    });
  }

  @Delete(':id')
  @Roles('ADMIN')
  @UseGuards(CityPolicyGuard)
  async remove(@Param('id') id: string, @Request() req) {
    const userCity = req.user.ciudad;
    const policy = getCityPolicy(userCity);

    if (!policy.canDelete) {
      throw new ForbiddenException(`Los admins de ${userCity} no pueden eliminar empresas`);
    }

    // Verificar si la empresa tiene empleados o usuarios asociados
    const company = await this.prisma.company.findUnique({
      where: { id: parseInt(id) },
      include: {
        empleados: true,
        usuarios: true,
      },
    });

    if (company.empleados.length > 0 || company.usuarios.length > 0) {
      throw new ForbiddenException('No se puede eliminar una empresa que tiene empleados o usuarios asociados');
    }

    return this.prisma.company.delete({
      where: { id: parseInt(id) },
    });
  }
}