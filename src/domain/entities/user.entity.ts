export class User {
  id: number;
  nombre: string;
  correo: string;
  contrasenaHash: string;
  rol: string; // 'ADMIN' o 'USUARIO'
  companiaId?: number | null;
  fechaCreacion: Date;
}
