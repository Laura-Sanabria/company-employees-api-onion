BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Company] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nombre] NVARCHAR(1000) NOT NULL,
    [direccion] NVARCHAR(1000) NOT NULL,
    [telefono] NVARCHAR(1000) NOT NULL,
    [ciudad] NVARCHAR(1000) NOT NULL CONSTRAINT [Company_ciudad_df] DEFAULT 'medellin',
    [fechaCreacion] DATETIME2 NOT NULL CONSTRAINT [Company_fechaCreacion_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Company_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Employee] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nombre] NVARCHAR(1000) NOT NULL,
    [apellido] NVARCHAR(1000) NOT NULL,
    [correo] NVARCHAR(1000) NOT NULL,
    [cargo] NVARCHAR(1000) NOT NULL,
    [salario] FLOAT(53) NOT NULL,
    [companiaId] INT NOT NULL,
    CONSTRAINT [Employee_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Employee_correo_key] UNIQUE NONCLUSTERED ([correo])
);

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] INT NOT NULL IDENTITY(1,1),
    [nombre] NVARCHAR(1000) NOT NULL,
    [correo] NVARCHAR(1000) NOT NULL,
    [contrasenaHash] NVARCHAR(1000) NOT NULL,
    [rol] NVARCHAR(1000) NOT NULL CONSTRAINT [User_rol_df] DEFAULT 'EMPLEADO',
    [ciudad] NVARCHAR(1000) NOT NULL CONSTRAINT [User_ciudad_df] DEFAULT 'medellin',
    [companiaId] INT,
    [fechaCreacion] DATETIME2 NOT NULL CONSTRAINT [User_fechaCreacion_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_correo_key] UNIQUE NONCLUSTERED ([correo])
);

-- AddForeignKey
ALTER TABLE [dbo].[Employee] ADD CONSTRAINT [Employee_companiaId_fkey] FOREIGN KEY ([companiaId]) REFERENCES [dbo].[Company]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_companiaId_fkey] FOREIGN KEY ([companiaId]) REFERENCES [dbo].[Company]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
