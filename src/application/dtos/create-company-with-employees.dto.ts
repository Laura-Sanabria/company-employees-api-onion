import { Type } from 'class-transformer';
import { ValidateNested, IsArray, IsString, IsNotEmpty, IsNumber, IsPositive, IsEmail, ArrayMinSize } from 'class-validator';

class EmployeeForCompanyDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  apellido: string;

  @IsEmail({}, { message: 'Formato de correo inválido' })
  @IsNotEmpty()
  correo: string;

  @IsString()
  @IsNotEmpty()
  cargo: string;

  @IsNumber()
  @IsPositive({ message: 'El salario debe ser mayor que 0' })
  salario: number;
}

export class CreateCompanyWithEmployeesDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  direccion: string;

  @IsString()
  @IsNotEmpty()
  telefono: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EmployeeForCompanyDto)
  empleados: EmployeeForCompanyDto[];
}