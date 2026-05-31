import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CompanyService } from '../../application/services/company.service';
import { CreateCompanyDto } from '../../application/dtos/create-company.dto';
import { UpdateCompanyDto } from '../../application/dtos/update-company.dto';
import { CreateCompanyWithEmployeesDto } from '../../application/dtos/create-company-with-employees.dto';
import { CompanyEmployeesQueryDto } from '../../application/dtos/employee-list-query.dto';

@Controller('api/companias')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  async findAll() {
    return this.companyService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.companyService.findById(+id);
  }

  @Get(':id/empleados')
  async getEmployees(
    @Param('id') id: string,
    @Query() query: CompanyEmployeesQueryDto,
  ) {
    return this.companyService.getEmployeesByCompany(+id, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companyService.create(createCompanyDto);
  }

  // ENDPOINT TRANSACCIONAL OBLIGATORIO
  @Post('con-empleados')
  @HttpCode(HttpStatus.CREATED)
  async createWithEmployees(@Body() createDto: CreateCompanyWithEmployeesDto) {
    return this.companyService.createWithEmployees(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companyService.update(+id, updateCompanyDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    return this.companyService.delete(+id);
  }
}