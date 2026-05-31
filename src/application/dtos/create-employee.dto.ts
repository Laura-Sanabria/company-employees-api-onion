import { IsString, IsNotEmpty, IsEmail, IsNumber, IsPositive, IsInt } from 'class-validator';

export class CreateEmployeeDto {
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

  @IsInt()
  @IsNotEmpty()
  companiaId: number;
}