```

## Tu README actualizado y completo (copia y pega todo):

```markdown
# API REST - Gestión de Compañías y Empleados

API REST funcional construida con **NestJS**, **Prisma ORM** y **SQLite**, aplicando **Arquitectura Onion**, **Repository Pattern** y **Unit of Work**.

## 📋 Tecnologías utilizadas

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | 18+ | Entorno de ejecución |
| NestJS | 10.x | Framework backend |
| Prisma ORM | 5.22.0 | ORM para base de datos |
| SQLite | 3.x | Base de datos |
| TypeScript | 5.x | Lenguaje |
| class-validator | - | Validaciones |

## 🏗️ Arquitectura Aplicada

### Onion Architecture (Arquitectura de Cebolla)

```
┌─────────────────────────────────────────────────────────┐
│                      API / Presentation                 │
│  (Controladores, Middlewares, Logging)                  │
├─────────────────────────────────────────────────────────┤
│                   Application Layer                      │
│  (Servicios, DTOs, Casos de uso, Validaciones)          │
├─────────────────────────────────────────────────────────┤
│                   Infrastructure Layer                   │
│  (Repositorios concretos, Prisma, Base de datos)        │
├─────────────────────────────────────────────────────────┤
│                      Domain Layer                        │
│  (Entidades, Interfaces de repositorios)                │
└─────────────────────────────────────────────────────────┘
```

### Flujo de la aplicación
Controller → Service → Unit of Work → Repository → ORM → Database

## 📁 Estructura del Proyecto

```
company-employees-api/
├── src/
│   ├── api/                    # Capa Presentation
│   │   ├── controllers/        # Endpoints REST
│   │   └── middlewares/        # Logging HTTP
│   ├── application/            # Capa Application
│   │   ├── dtos/               # Data Transfer Objects
│   │   └── services/           # Lógica de negocio
│   ├── domain/                 # Capa Domain (Core)
│   │   ├── entities/           # Entidades Company y Employee
│   │   └── repositories/       # Interfaces de repositorios
│   ├── infrastructure/         # Capa Infrastructure
│   │   ├── prisma/             # Cliente de Prisma
│   │   └── repositories/       # Implementación de repositorios
│   └── shared/                 # Recursos compartidos
│       └── unit-of-work/       # Unit of Work
├── prisma/
│   ├── schema.prisma           # Esquema de base de datos
│   ├── seed.ts                 # Datos iniciales
│   └── migrations/             # Migraciones
└── package.json
```

## 🗄️ Modelo de Datos

## 📊 Diagrama Entidad-Relación (ER)

**COMPAÑÍA (1)** ────────────────── **EMPLEADO (⭐)**

| COMPAÑÍA           |       | EMPLEADO              |
|--------------------|-------|-----------------------|
| id (PK)           |       | id (PK)               |
| nombre            |       | nombre                |
| direccion         |       | companiaId (FK)       |
| telefono          |       | apellido              |
| fechaCreacion     |       | correo (UNIQUE)       |
|                   |       | cargo                 |
|                   |       | salario               |

**Relación:** Una compañía tiene muchos empleados (1 a N)

### Entidad Compañía

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Int | Llave primaria (autoincrementable) |
| nombre | String | Nombre de la compañía |
| direccion | String | Dirección física |
| telefono | String | Número de contacto |
| fechaCreacion | DateTime | Fecha de registro (default: now()) |

### Entidad Empleado

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Int | Llave primaria (autoincrementable) |
| nombre | String | Nombre del empleado |
| apellido | String | Apellido del empleado |
| correo | String | Correo electrónico (único) |
| cargo | String | Cargo o rol |
| salario | Float | Salario asignado |
| companiaId | Int | Llave foránea hacia Compañía |

### Relación

**Compañía (1) ——— (⭐) Empleado**

Una compañía puede tener muchos empleados. Cada empleado pertenece a una sola compañía.

## 🔧 Instalación y Configuración

### Requisitos previos

- Node.js 18 o superior
- npm 9 o superior

### Pasos para ejecutar localmente

```bash
# 1. Clonar el repositorio
git clone https://github.com/Laura-Sanabria/company-employees-api-onion.git

# 2. Entrar al directorio
cd company-employees-api-onion

# 3. Instalar dependencias
npm install

# 4. Configurar variables de entorno
DATABASE_URL="file:./dev.db"

# 5. Ejecutar migraciones
npx prisma migrate deploy

# 6. Insertar datos iniciales (3 compañías, 10 empleados)
npx prisma db seed

# 7. Iniciar la API
npm run start:dev
```

La API correrá en `http://localhost:3000`

## 📌 Endpoints REST

### Compañías

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/companias` | Listar todas las compañías |
| GET | `/api/companias/{id}` | Obtener una compañía por ID |
| GET | `/api/companias/{id}/empleados` | Listar empleados de una compañía |
| POST | `/api/companias` | Crear una compañía |
| PUT | `/api/companias/{id}` | Actualizar una compañía |
| DELETE | `/api/companias/{id}` | Eliminar una compañía |

### Empleados

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/empleados` | Listar todos los empleados |
| GET | `/api/empleados/{id}` | Obtener un empleado por ID |
| POST | `/api/empleados` | Crear un empleado |
| PUT | `/api/empleados/{id}` | Actualizar un empleado |
| DELETE | `/api/empleados/{id}` | Eliminar un empleado |

### ⭐ Endpoint Transaccional (Requisito obligatorio)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/companias/con-empleados` | Crear una compañía con sus empleados en UNA SOLA transacción |

**Característica importante:** Si falla la creación de algún empleado, NO se guarda la compañía ni ningún empleado (Todo o Nada).

#### Ejemplo de body para endpoint transaccional:

```json
{
    "nombre": "Empresa Tecnológica",
    "direccion": "Calle Principal 123",
    "telefono": "555-1234",
    "empleados": [
        {
            "nombre": "Ana",
            "apellido": "García",
            "correo": "ana@tecnologica.com",
            "cargo": "Desarrolladora",
            "salario": 4000000
        },
        {
            "nombre": "Carlos",
            "apellido": "López",
            "correo": "carlos@tecnologica.com",
            "cargo": "Tester",
            "salario": 3500000
        }
    ]
}
```

## 🔄 Repository Pattern

Se implementaron repositorios para las entidades `Company` y `Employee`, con los siguientes métodos:

| Método | Propósito |
|--------|-----------|
| `findAll()` | Obtener todos los registros |
| `findById()` | Obtener un registro por ID |
| `create()` | Crear un nuevo registro |
| `update()` | Actualizar un registro existente |
| `delete()` | Eliminar un registro |
| `findByCondition()` | Buscar por condición |
| `findByCompanyId()` | Buscar empleados por compañía |
| `findByEmail()` | Buscar empleado por correo |

## 🔐 Unit of Work

```typescript
// Ejemplo de uso en servicios
async createWithEmployees(createDto: CreateCompanyWithEmployeesDto) {
  return this.uow.executeTransaction(async (tx) => {
    const company = await tx.companies.create(...);
    for (const emp of createDto.empleados) {
      await tx.employees.create({ ...emp, companiaId: company.id });
    }
    return company;
  });
}
```

## Programación asíncrona

### ¿Mi tecnología soporta async? (sí/no y por qué)

**Sí.** NestJS corre sobre Node.js, un entorno orientado a operaciones no bloqueantes. Los controladores pueden declararse con `async` y devolver `Promise<T>`; mientras se espera I/O (consultas a SQLite vía Prisma), el event loop puede atender otras peticiones.

Prisma ORM también es asíncrono de forma nativa: métodos como `findMany`, `create`, `update` y `$transaction` devuelven **Promesas**. No existe un cliente Prisma “sincrónico” separado; `PrismaClient` (implementado en `PrismaService`) **es** la sesión/contexto async del ORM.

| Componente | Mecanismo async | Objeto de sesión |
|------------|-----------------|------------------|
| NestJS | Handlers `async` + `await` | — |
| Prisma | Promesas en cada operación | `PrismaService` / `TransactionClient` dentro de `$transaction` |
| Unit of Work | `await prisma.$transaction(async (tx) => ...)` | Misma transacción compartida por repositorios |

### Qué se refactorizó (o alternativa aplicada)

Toda la cadena de la API sigue el flujo async de afuera hacia adentro:

```
Controller (async handler)
  ↓ await
Service (async)
  ↓ await
UnitOfWork.executeTransaction()
  ↓ await
Repository (async)
  ↓ await
PrismaClient / TransactionClient
  ↓
SQLite
```

**Capas ya en modelo async:**

- **Controladores:** todos los handlers son `async` y delegan a servicios que devuelven Promesas.
- **Servicios:** `CompanyService` y `EmployeeService` usan `await` dentro de `executeTransaction`.
- **Unit of Work:** `executeTransaction` envuelve `prisma.$transaction`; commit y rollback los gestiona Prisma al resolver o rechazar la Promesa.
- **Repositorios:** métodos `async` con `await` en operaciones Prisma; consultas paginadas usan `Promise.all` para datos y conteo en paralelo.

**Corrección aplicada en Módulo 2:** `CompanyService.update` y `CompanyService.delete` dejaron de llamar a `this.findById()` dentro de una transacción (eso abría una transacción anidada). Ahora validan con `ensureCompanyExists(tx, id)` usando la misma sesión `tx` del Unit of Work.

**Precauciones con el Unit of Work:**

- Una petición = una transacción; no se comparte `tx` entre peticiones concurrentes.
- Las operaciones por lote y el endpoint `POST /api/companias/con-empleados` ejecutan todos los pasos dentro de un solo `$transaction`: si falla un empleado, Prisma revierte todo.
- Los repositorios no llaman a `commit` ni `save`; solo el Unit of Work confirma la transacción.

**Prueba manual del rollback transaccional:**

```bash
# Enviar un empleado con correo duplicado (debe fallar y no guardar nada)
curl -X POST http://localhost:3000/api/companias/con-empleados \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test Rollback","direccion":"Calle 1","telefono":"3000000000","empleados":[{"nombre":"A","apellido":"Uno","correo":"ana.gomez@tech.com","cargo":"Dev","salario":3000000},{"nombre":"B","apellido":"Dos","correo":"b@test.com","cargo":"Dev","salario":3000000}]}'

# Verificar que "Test Rollback" NO aparece en la lista de compañías
curl http://localhost:3000/api/companias
```

### Comparación con ASP.NET Core Entity Framework

| Concepto en ASP.NET Core | Equivalente en esta API |
|--------------------------|------------------------|
| Controller | Controller (NestJS) |
| DbContext | PrismaService |
| DbSet | PrismaCompanyRepository / PrismaEmployeeRepository |
| Migration | npx prisma migrate dev |
| Unit of Work | UnitOfWork.executeTransaction() |
| Service Layer | Services (CompanyService, EmployeeService) |
| Dependency Injection | @Injectable() de NestJS |
| async / await + Task\<T\> | async / await + Promise\<T\> |
| Logging | Middleware Logger |

## 🧪 Pruebas

### Ejemplos de peticiones con curl

```bash
# Listar compañías
curl http://localhost:3000/api/companias

# Listar empleados de compañía ID=1
curl http://localhost:3000/api/companias/1/empleados

# Crear compañía con empleados (transaccional)
curl -X POST http://localhost:3000/api/companias/con-empleados \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Nueva","direccion":"Calle 123","telefono":"555-0000","empleados":[{"nombre":"Juan","apellido":"Perez","correo":"juan@test.com","cargo":"Dev","salario":3500000}]}'
```

## 📊 Datos Iniciales

Al ejecutar `npx prisma db seed`, se insertan automáticamente:

- **3 compañías** (Tech Solutions SAS, Innovation Corp, Digital Services Ltda)
- **10 empleados** distribuidos entre las 3 compañías

## 🛠️ Comandos útiles

```bash
# Generar cliente de Prisma
npx prisma generate

# Crear migración
npx prisma migrate dev --name nombre_migracion

# Abrir Prisma Studio (interfaz visual de BD)
npx prisma studio

# Ejecutar seed
npx prisma db seed

# Modo desarrollo con hot-reload
npm run start:dev

# Compilar para producción
npm run build

# Ejecutar en producción
npm run start:prod
```
