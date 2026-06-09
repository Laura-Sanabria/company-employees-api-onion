import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeService } from './employee.service';
import { UnitOfWork, TransactionUnit } from '../../shared/unit-of-work/unit-of-work.service';
import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Employee } from '../../domain/entities/employee.entity';

describe('EmployeeService (Unitaria)', () => {
  let service: EmployeeService;
  let mockUow: jest.Mocked<UnitOfWork>;
  let mockEmployeesRepo: any;
  let mockCompaniesRepo: any;

  beforeEach(async () => {
    mockEmployeesRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    mockCompaniesRepo = {
      findById: jest.fn(),
    };

    mockUow = {
      executeTransaction: jest.fn().mockImplementation(async (fn: any) => {
        const tx = new TransactionUnit(mockCompaniesRepo, mockEmployeesRepo);
        return fn(tx);
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        {
          provide: UnitOfWork,
          useValue: mockUow,
        },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
  });

  describe('findById', () => {
    it('debería retornar el empleado si existe', async () => {
      const mockEmployee: Employee = {
        id: 1,
        nombre: 'Juan',
        apellido: 'Perez',
        correo: 'juan.perez@ejemplo.com',
        cargo: 'Desarrollador',
        salario: 3500000,
        companiaId: 1,
      };

      mockEmployeesRepo.findById.mockResolvedValue(mockEmployee);

      const result = await service.findById(1);

      expect(result).toEqual(mockEmployee);
      expect(mockEmployeesRepo.findById).toHaveBeenCalledWith(1);
    });

    it('debería lanzar NotFoundException si el empleado no existe', async () => {
      mockEmployeesRepo.findById.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(
        new NotFoundException('Empleado con ID 999 no encontrado'),
      );
      expect(mockEmployeesRepo.findById).toHaveBeenCalledWith(999);
    });
  });

  describe('create', () => {
    it('debería lanzar UnprocessableEntityException si el correo ya existe', async () => {
      const createDto = {
        nombre: 'Carlos',
        apellido: 'Gomez',
        correo: 'carlos@ejemplo.com',
        cargo: 'Diseñador',
        salario: 2500000,
        companiaId: 1,
      };

      const mockEmployee: Employee = {
        id: 2,
        ...createDto,
      };

      // Simular que la compañía sí existe
      mockCompaniesRepo.findById.mockResolvedValue({ id: 1, nombre: 'Compañía 1' });
      // Simular que el correo ya está registrado
      mockEmployeesRepo.findByEmail.mockResolvedValue(mockEmployee);

      await expect(service.create(createDto)).rejects.toThrow(
        new UnprocessableEntityException({
          mensaje: 'Error de validación',
          errores: [
            {
              campo: 'correo',
              detalle: 'El correo carlos@ejemplo.com ya está registrado',
            },
          ],
        }),
      );

      expect(mockCompaniesRepo.findById).toHaveBeenCalledWith(1);
      expect(mockEmployeesRepo.findByEmail).toHaveBeenCalledWith('carlos@ejemplo.com');
      expect(mockEmployeesRepo.create).not.toHaveBeenCalled();
    });
  });
});
