export interface PagedQuery {
  pagina: number;
  tamano: number;
  orden?: string;
  dir?: 'asc' | 'desc';
  buscar?: string;
}

export interface PagedResult<T> {
  datos: T[];
  pagina: number;
  tamano: number;
  total: number;
  totalPaginas: number;
}

export const EMPLOYEE_SORT_FIELDS = [
  'nombre',
  'apellido',
  'correo',
  'salario',
  'cargo',
] as const;

export type EmployeeSortField = (typeof EMPLOYEE_SORT_FIELDS)[number];
