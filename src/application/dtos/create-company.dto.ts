import { IsString, IsNotEmpty, MinLength, MaxLength, IsNumberString, Length } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre no debe superar los 100 caracteres' })
  nombre: string;

  @IsString()
  @IsNotEmpty()
  direccion: string;

  @IsString()
  @IsNotEmpty()
  @IsNumberString({}, { message: 'El teléfono debe contener solo dígitos' })
  @Length(7, 15, { message: 'El teléfono debe tener entre 7 y 15 dígitos' })
  telefono: string;
}