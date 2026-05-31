import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { EMPLOYEE_SORT_FIELDS } from '../../domain/dtos/pagination.dto';

export class EmployeeListQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  tamano = 10;

  @IsOptional()
  @IsString()
  @IsIn([...EMPLOYEE_SORT_FIELDS])
  orden?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  dir?: 'asc' | 'desc';

  @IsOptional()
  @IsString()
  buscar?: string;
}

export class CompanyEmployeesQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  tamano = 10;
}
