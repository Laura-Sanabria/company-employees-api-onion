import { Company } from '../entities/company.entity';

export interface ICompanyRepository {
  findAll(): Promise<Company[]>;
  findById(id: number): Promise<Company | null>;
  create(data: Omit<Company, 'id' | 'fechaCreacion'>): Promise<Company>;
  update(id: number, data: Partial<Company>): Promise<Company>;
  delete(id: number): Promise<void>;
  findByCondition(condition: Partial<Company>): Promise<Company[]>;
}