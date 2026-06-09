# API REST - Gestión de Compañías y Empleados

API REST construida con **NestJS**, **Prisma ORM** y **SQLite**, aplicando **Arquitectura Onion**, **Repository Pattern** y **Unit of Work**.

## Tecnologías utilizadas

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | 18+ | Entorno de ejecución |
| NestJS | 10.x | Framework backend |
| Prisma ORM | 5.22.0 | ORM para base de datos |
| SQLite | 3.x | Base de datos |
| TypeScript | 5.x | Lenguaje |
| class-validator | - | Validaciones |

## Arquitectura aplicada

### Onion Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      API / Presentation                 │
│  (Controladores, filtros, validación de entrada)        │
├─────────────────────────────────────────────────────────┤
│                   Application Layer                     │
│  (Servicios, DTOs, reglas de negocio)                  │
├─────────────────────────────────────────────────────────┤
│                   Infrastructure Layer                  │
│  (Repositorios concretos, Prisma, base de datos)        │
├─────────────────────────────────────────────────────────┤
│                      Domain Layer                       │
│  (Entidades, interfaces de repositorios)                │
└─────────────────────────────────────────────────────────┘
```

### Flujo de la aplicación

```
Controller → Service → Unit of Work → Repository → ORM → Database
```

## Instalación y configuración

### Requisitos previos

- Node.js 18 o superior
- npm 9 o superior

### Pasos para ejecutar localmente

```bash
git clone https://github.com/Laura-Sanabria/company-employees-api-onion.git
cd company-employees-api-onion
npm install
cp .env.example .env
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

La API corre en `http://localhost:3000`.

## Endpoints REST

### Compañías

| Método | Endpoint | Descripción | HTTP |
|--------|----------|-------------|------|
| GET | `/api/companias` | Listar todas las compañías | 200 |
| GET | `/api/companias/{id}` | Obtener una compañía por ID | 200 / 404 |
| GET | `/api/companias/{id}/empleados?pagina=&tamano=` | Empleados de una compañía (paginado) | 200 / 404 |
| POST | `/api/companias` | Crear una compañía | 201 |
| POST | `/api/companias/con-empleados` | Crear compañía + empleados (transacción) | 201 |
| PUT | `/api/companias/{id}` | Actualizar una compañía | 200 / 404 |
| DELETE | `/api/companias/{id}` | Eliminar una compañía | 204 / 404 |

### Empleados (objeto individual)

| Método | Endpoint | Descripción | HTTP |
|--------|----------|-------------|------|
| GET | `/api/empleados/{id}` | Obtener un empleado por ID | 200 / 404 |
| POST | `/api/empleados` | Crear un empleado | 201 |
| PUT | `/api/empleados/{id}` | Actualizar un empleado (completo) | 200 / 404 |
| PATCH | `/api/empleados/{id}` | Actualización parcial | 200 / 404 |
| DELETE | `/api/empleados/{id}` | Eliminar un empleado | 204 / 404 |

### Empleados (colecciones — Módulo 1)

| Método | Endpoint | Descripción | HTTP |
|--------|----------|-------------|------|
| GET | `/api/empleados?pagina=&tamano=&orden=&dir=&buscar=` | Listado paginado, filtrado y ordenado | 200 / 400 |
| POST | `/api/empleados/lote` | Creación masiva (bulk) | 201 |
| DELETE | `/api/empleados/lote` | Eliminación múltiple (body: `{ "ids": [...] }`) | 204 / 404 |

Las operaciones por lote (`/lote`) y el endpoint transaccional usan **una sola transacción** del Unit of Work: o se aplican todos los cambios, o ninguno.

## CRUD de colecciones

### Creación masiva

```bash
curl -X POST http://localhost:3000/api/empleados/lote \
  -H "Content-Type: application/json" \
  -d '{
    "empleados": [
      {
        "nombre": "Laura",
        "apellido": "Ruiz",
        "correo": "laura.ruiz@ejemplo.com",
        "cargo": "Analista",
        "salario": 3200000,
        "companiaId": 1
      },
      {
        "nombre": "Pedro",
        "apellido": "Mesa",
        "correo": "pedro.mesa@ejemplo.com",
        "cargo": "Soporte",
        "salario": 2800000,
        "companiaId": 1
      }
    ]
  }'
```

### Actualización parcial (PATCH)

```bash
curl -X PATCH http://localhost:3000/api/empleados/1 \
  -H "Content-Type: application/json" \
  -d '{ "salario": 3500000 }'
```

### Eliminación múltiple

```bash
curl -X DELETE http://localhost:3000/api/empleados/lote \
  -H "Content-Type: application/json" \
  -d '{ "ids": [8, 9] }'
```

### Endpoint transaccional (Parte I)

```bash
curl -X POST http://localhost:3000/api/companias/con-empleados \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Empresa Tecnológica",
    "direccion": "Calle Principal 123",
    "telefono": "5551234",
    "empleados": [
      {
        "nombre": "Ana",
        "apellido": "García",
        "correo": "ana@tecnologica.com",
        "cargo": "Desarrolladora",
        "salario": 4000000
      }
    ]
  }'
```

## Paginación, filtrado y ordenamiento

### Parámetros de consulta

| Parámetro | Descripción | Default |
|-----------|-------------|---------|
| `pagina` | Número de página (desde 1) | 1 |
| `tamano` | Registros por página (máx. 100) | 10 |
| `orden` | Campo: `nombre`, `apellido`, `correo`, `salario`, `cargo` | `apellido` |
| `dir` | `asc` o `desc` | `asc` |
| `buscar` | Texto en nombre, apellido o correo | — |

Ejemplo:

```bash
curl "http://localhost:3000/api/empleados?pagina=1&tamano=10&orden=apellido&dir=asc&buscar=gomez"
```

### Respuesta (envelope)

```json
{
  "datos": [ { "id": 1, "nombre": "...", "apellido": "...", "...": "..." } ],
  "pagina": 1,
  "tamano": 10,
  "total": 57,
  "totalPaginas": 6
}
```

### Implementación en Prisma (capa Infrastructure)

En `PrismaEmployeeRepository.getPaged` se aplica este orden:

1. **Filtro** — `where` con `OR` y `contains` sobre `nombre`, `apellido`, `correo`.
2. **Ordenamiento** — `orderBy` dinámico según `orden` y `dir`.
3. **Paginación** — `skip = (pagina - 1) * tamano` y `take = tamano`; el total con `count({ where })` en paralelo (`Promise.all`).

Equivalente conceptual en ASP.NET Core: `Where` → `OrderBy`/`OrderByDescending` → `Skip`/`Take`.

Parámetros inválidos devuelven **400 Bad Request**; errores de body en operaciones de escritura devuelven **422**.

## Repository Pattern

| Método | Propósito |
|--------|-----------|
| `findAll()` / `findById()` | Consultas básicas (Parte I) |
| `create()` / `update()` / `delete()` | CRUD individual |
| `findByEmail()` / `findByCompanyId()` | Consultas de negocio |
| `createRange()` | Creación masiva (sin commit) |
| `deleteRange()` | Eliminación múltiple (sin commit) |
| `getPaged()` | Listado paginado, filtrado y ordenado |
| `getByCompanyPaged()` | Empleados por compañía paginados |
| `patchPartial()` | Actualización solo de campos enviados |
| `countByIds()` | Verificar existencia antes de borrar en lote |

Los repositorios **no** llaman a `commit` ni `save`; eso lo hace el Unit of Work.

## Unit of Work

```typescript
async createBulk(dto: BulkCreateEmployeesDto) {
  return this.uow.executeTransaction(async (tx) => {
    // validaciones de negocio...
    return tx.employees.createRange(dto.empleados);
  });
}
```

## Programación asíncrona

### ¿Mi tecnología soporta async? (sí/no y por qué)

**Sí.** NestJS corre sobre Node.js. Los controladores usan `async`/`await`; Prisma devuelve Promesas en cada operación. El `UnitOfWork` usa `prisma.$transaction(async (tx) => ...)`.

### Qué se refactorizó (o alternativa aplicada)

```
Controller (async) → Service (async) → UnitOfWork → Repository (async) → Prisma → SQLite
```

- Consultas paginadas: `Promise.all` para `findMany` y `count` en paralelo.
- Operaciones por lote y `POST /api/companias/con-empleados` en una sola transacción.

## Comparación ampliada con ASP.NET Core

| Concepto en ASP.NET Core | Equivalente en esta API |
|--------------------------|-------------------------|
| Controller | Controller (NestJS) |
| DbContext | PrismaService |
| DbSet\<T\> | Repositorios Prisma |
| Migration | `npx prisma migrate dev` |
| Unit of Work | `UnitOfWork.executeTransaction()` |
| Service Layer | `CompanyService`, `EmployeeService` |
| Endpoints de colección (List/IEnumerable) | `POST/DELETE /lote`, listado paginado |
| Paginación (Skip/Take) | `skip` / `take` en Prisma |
| PATCH parcial | `PATCH` + `patchPartial()` |
| async/await + Task\<T\> | async/await + Promise\<T\> |
| [FromQuery] paginación | `EmployeeListQueryDto` + ValidationPipe |
| DataAnnotations / FluentValidation | class-validator (Módulo 3) |
| Dependency Injection | `@Injectable()` de NestJS |
| xUnit / NUnit + Moq | Jest + `@nestjs/testing` / `supertest` (Módulo 4) |
| AddAuthentication().AddJwtBearer() | `PassportModule` + `JwtModule` de NestJS (Módulo 5) |
| [Authorize(Roles = "...")] | `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)` (Módulo 5) |
| [Authorize(Policy = "...")] | `EmployeeOwnershipGuard` de NestJS que evalúa la propiedad del recurso |
| ClaimsPrincipal / Claims | Objeto `req.user` inyectado por la estrategia de Passport (Módulo 5) |

## Validaciones

### Librería usada y reglas aplicadas
Para garantizar que los datos de entrada a la API sean válidos antes de interactuar con el dominio o la base de datos, se utilizan las librerías **class-validator** y **class-transformer** en la capa de Aplicación/Presentación, aplicadas de manera global en [main.ts](file:///c:/Users/SENA/Desktop/company-employees-api-onion/src/main.ts) mediante `ValidationPipe`.

Las reglas de validación mínima aplicadas a los DTOs de entrada son:
* **Compañía:**
  * `nombre`: Obligatorio, cadena de caracteres de 3 a 100 caracteres.
  * `telefono`: Obligatorio, solo dígitos y longitud válida.
  * `direccion`: Obligatorio, cadena de caracteres.
* **Empleado:**
  * `nombre` / `apellido`: Obligatorios, cadenas de caracteres no vacías.
  * `correo`: Obligatorio, formato de correo electrónico válido y único.
  * `cargo`: Obligatorio, cadena de caracteres no vacía.
  * `salario`: Obligatorio, numérico y mayor que 0.
  * `companiaId`: Obligatorio, entero que debe pertenecer a una compañía existente.

Cuando una validación de formato o de negocio falla, el filtro global de excepciones intercepta el error devolviendo un código **422 Unprocessable Entity** (para errores de validación en escrituras) o **400 Bad Request** (para query params inválidos) con la siguiente estructura:

```json
{
  "mensaje": "Error de validación",
  "errores": [
    { "campo": "correo", "detalle": "Formato de correo inválido" },
    { "campo": "salario", "detalle": "El salario debe ser mayor que 0" }
  ]
}
```

## Pruebas

### Cómo ejecutar las pruebas
Para ejecutar las pruebas automatizadas (unitarias y de integración/E2E), utiliza los siguientes comandos:

```bash
# Ejecutar todas las pruebas (Jest)
npm run test

# Ejecutar pruebas en modo de observación (watch)
npm run test:watch

# Ejecutar las pruebas de integración (E2E)
npm run test:e2e

# Ejecutar pruebas y generar el reporte de cobertura
npm run test:cov
```

### Ejemplos con curl

#### Listado paginado
```bash
curl "http://localhost:3000/api/empleados?pagina=1&tamano=5&orden=apellido&dir=asc"
```

#### Empleados de compañía 1
```bash
curl "http://localhost:3000/api/companias/1/empleados?pagina=1&tamano=10"
```

#### Parámetros inválidos (400)
```bash
curl "http://localhost:3000/api/empleados?pagina=0&tamano=10"
```

### Prueba manual del rollback transaccional
```bash
curl -X POST http://localhost:3000/api/companias/con-empleados \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test Rollback","direccion":"Calle 1","telefono":"3000000000","empleados":[{"nombre":"A","apellido":"Uno","correo":"ana.gomez@tech.com","cargo":"Dev","salario":3000000}]}'

curl http://localhost:3000/api/companias
```

Verificar que "Test Rollback" no aparece si el correo ya existía.

## Seguridad

### Autenticación con JWT
La autenticación en esta API se realiza mediante JSON Web Tokens (JWT). El flujo general de autenticación consiste en:
1. **Registro:** El usuario se registra enviando sus datos a `POST /api/auth/registro`. La contraseña es cifrada asíncronamente utilizando `bcryptjs` antes de almacenarse en la base de datos como un hash seguro (`contrasenaHash`).
2. **Login:** El usuario inicia sesión a través de `POST /api/auth/login`. Si las credenciales son válidas, la API genera y firma un token JWT utilizando una clave secreta (`JWT_SECRET`) configurada en el entorno.
3. **Peticiones Protegidas:** El cliente debe adjuntar el JWT obtenido en la cabecera `Authorization: Bearer <token>` para todas las peticiones a endpoints protegidos.
4. **Validación:** NestJS utiliza un guard de autenticación (`JwtAuthGuard`) junto con una estrategia de Passport (`JwtStrategy`) para validar de forma transparente la firma y la fecha de expiración del token en cada petición entrante, inyectando la información del usuario autenticado en el objeto `req.user`.
5. **Perfil:** El endpoint `GET /api/auth/perfil` permite recuperar los datos del usuario actualmente autenticado.

### Autorización por roles
El acceso a los recursos de la API está restringido mediante roles utilizando una estrategia basada en decoradores y guardias de NestJS:
- **Decorador `@Roles(...)`:** Permite especificar qué roles están autorizados para acceder a un controlador o endpoint en específico.
- **Guard `RolesGuard`:** Evalúa si el usuario autenticado (extraído de `req.user.rol`) posee uno de los roles permitidos para ejecutar la acción solicitada. Si no lo posee, deniega el acceso retornando un código `403 Forbidden`.

#### Matriz de Autorización por Roles:
| Operación | Método/Ruta | Rol Requerido |
|---|---|---|
| Registrar un usuario | `POST /api/auth/registro` | Pública |
| Iniciar sesión | `POST /api/auth/login` | Pública |
| Ver perfil propio | `GET /api/auth/perfil` | Cualquier usuario autenticado |
| Listar o consultar compañías/empleados | `GET /api/companias` y `GET /api/empleados` | Cualquier usuario autenticado |
| Crear o actualizar compañías/empleados | `POST/PUT/PATCH /api/companias` y `POST/PUT/PATCH /api/empleados` | `ADMIN` o `USUARIO` |
| Eliminar un recurso | `DELETE /api/companias/{id}` y `DELETE /api/empleados/{id}` | Solo `ADMIN` |
| Creación masiva de empleados | `POST /api/empleados/lote` | Solo `ADMIN` |
| Eliminación múltiple de empleados | `DELETE /api/empleados/lote` | Solo `ADMIN` |
| Crear compañía con empleados | `POST /api/companias/con-empleados` (Transaccional) | Solo `ADMIN` |

### Autorización por políticas (policies)
La API implementa la política de propiedad **`EsPropietarioDeCompania`** a través de [employee-ownership.guard.ts](file:///c:/Users/SENA/Desktop/company-employees-api-onion/src/api/guards/employee-ownership.guard.ts) para proteger los endpoints individuales de escritura y eliminación de empleados:
- **Regla:** Un usuario con rol `USUARIO` solo puede crear, actualizar (`PUT`/`PATCH`) o eliminar (`DELETE`) empleados cuya `companiaId` coincida con la compañía vinculada a su cuenta (`companiaId` en el token JWT). No tiene autorización para alterar o interactuar con empleados pertenecientes a otras compañías.
- **Excepción:** Los administradores (rol `ADMIN`) están exentos de esta política y pueden gestionar empleados de cualquier compañía en el sistema.

## Variables de entorno
El proyecto utiliza variables de entorno cargadas mediante el paquete `dotenv`. Asegúrate de definir las siguientes variables en tu archivo `.env`:

```env
# URL de conexión a la base de datos SQL Server
DATABASE_URL="sqlserver://localhost:1433;database=CompanyEmployees;user=sa;password=xxxxxx;trustServerCertificate=true"

# Clave secreta usada para firmar y validar tokens JWT (Mantener fuera del código fuente principal)
JWT_SECRET="mi_secreto_super_seguro_para_jwt_987654321"
```

## Datos iniciales
`npx prisma db seed` inserta **3 compañías**, **10 empleados** y **2 usuarios iniciales** (1 Administrador y 1 Usuario regular).

## Comandos útiles
```bash
npx prisma generate
npx prisma migrate dev --name nombre_migracion
npx prisma studio
npx prisma db seed
npm run start:dev
npm run build
npm run start:prod
```

## Conclusiones de la Parte II
- **Abstracción Arquitectónica:** Se demostró cómo la arquitectura por capas (Onion Architecture) permite desacoplar por completo la lógica de negocio y aplicación del framework o del ORM subyacente. Los conceptos aprendidos originalmente en ASP.NET Core se transfieren perfectamente a NestJS manteniendo el patrón Repository y Unit of Work.
- **Seguridad Descentralizada:** El uso de Guards e interceptores en NestJS permite modularizar la seguridad, garantizando que el acceso y los roles se controlen en la capa de presentación antes de ingresar a la lógica del negocio.
- **Robustez Transaccional:** La centralización de la persistencia a través del Unit of Work asegura que los procesos críticos de creación y eliminación en lotes se ejecuten en una sola transacción atómica, previniendo estados inconsistentes en la base de datos.
