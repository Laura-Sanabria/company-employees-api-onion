import { Employee } from '../entities/employee.entity';
import { PagedQuery, PagedResult } from '../dtos/pagination.dto';

export interface IEmployeeRepository {
  findAll(): Promise<Employee[]>;
  findById(id: number): Promise<Employee | null>;
  create(data: Omit<Employee, 'id'>): Promise<Employee>;
  update(id: number, data: Partial<Employee>): Promise<Employee>;
  delete(id: number): Promise<void>;
  findByCompanyId(companyId: number): Promise<Employee[]>;
  findByEmail(email: string): Promise<Employee | null>;

  createRange(data: Omit<Employee, 'id'>[]): Promise<Employee[]>;
  patchPartial(id: number, data: Partial<Employee>): Promise<Employee>;
  deleteRange(ids: number[]): Promise<void>;
  getPaged(query: PagedQuery): Promise<PagedResult<Employee>>;
  getByCompanyPaged(
    companyId: number,
    query: Pick<PagedQuery, 'pagina' | 'tamano'>,
  ): Promise<PagedResult<Employee>>;
  countByIds(ids: number[]): Promise<number>;
}