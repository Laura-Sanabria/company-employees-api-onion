import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { EmployeeService } from '../../application/services/employee.service';
import { CreateEmployeeDto } from '../../application/dtos/create-employee.dto';
import { UpdateEmployeeDto } from '../../application/dtos/update-employee.dto';
import { PatchEmployeeDto } from '../../application/dtos/patch-employee.dto';
import { BulkCreateEmployeesDto } from '../../application/dtos/bulk-create-employees.dto';
import { BulkDeleteEmployeesDto } from '../../application/dtos/bulk-delete-employees.dto';
import { EmployeeListQueryDto } from '../../application/dtos/employee-list-query.dto';

@Controller('api/empleados')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  async findPaged(@Query() query: EmployeeListQueryDto) {
    return this.employeeService.findPaged(query);
  }

  @Post('lote')
  @HttpCode(HttpStatus.CREATED)
  async createBulk(@Body() dto: BulkCreateEmployeesDto) {
    const creados = await this.employeeService.createBulk(dto);
    return {
      mensaje: 'Creación masiva exitosa',
      creados: creados.length,
      empleados: creados,
    };
  }

  @Delete('lote')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBulk(@Body() dto: BulkDeleteEmployeesDto) {
    await this.employeeService.deleteBulk(dto);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.employeeService.findById(+id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeeService.create(createEmployeeDto);
  }

  @Patch(':id')
  async patch(
    @Param('id') id: string,
    @Body() patchEmployeeDto: PatchEmployeeDto,
  ) {
    return this.employeeService.patch(+id, patchEmployeeDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeeService.update(+id, updateEmployeeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    return this.employeeService.delete(+id);
  }
}
