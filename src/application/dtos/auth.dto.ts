import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsIn, IsInt } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @IsEmail({}, { message: 'Formato de correo inválido' })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  correo: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  contrasena: string;

  @IsOptional()
  @IsString()
  @IsIn(['ADMIN', 'USUARIO'], { message: 'El rol debe ser ADMIN o USUARIO' })
  rol?: string;

  @IsOptional()
  @IsInt({ message: 'El ID de compañía debe ser un entero' })
  companiaId?: number;
}

export class LoginDto {
  @IsEmail({}, { message: 'Formato de correo inválido' })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  correo: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  contrasena: string;
}
