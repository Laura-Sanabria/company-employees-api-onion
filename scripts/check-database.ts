import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const DATABASE_URL = process.env.DATABASE_URL;

function maskUrl(url: string): string {
  return url.replace(/password=[^;]*/i, 'password=***');
}

async function main(): Promise<void> {
  if (!DATABASE_URL?.trim()) {
    console.error('[ERROR] DATABASE_URL no está definida en .env');
    process.exit(1);
  }

  console.log('Comprobando conexión a SQL Server...');
  console.log(`Cadena (sin contraseña): ${maskUrl(DATABASE_URL)}`);

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    const result = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`;
    const serverName = await prisma.$queryRaw<{ name: string }[]>`
      SELECT @@SERVERNAME AS name
    `;

    console.log('');
    console.log('[OK] Conexión exitosa. El servidor SQL Server es accesible.');
    console.log(`     Instancia: ${serverName[0]?.name ?? 'desconocida'}`);
    console.log(`     Ping:      ${result[0]?.ok === 1 ? 'SELECT 1 OK' : 'respuesta inesperada'}`);
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('[ERROR] No se pudo conectar al servidor SQL Server.');
    if (error instanceof Error) {
      console.error(`     Detalle: ${error.message}`);
    } else {
      console.error('     Detalle:', error);
    }
    console.error('');
    if (error instanceof Error && error.message.includes('SQLEXPRESS:1433')) {
      console.error('');
      console.error('Sugerencia: su SQL escucha en 1433. Use host:puerto sin \\SQLEXPRESS, por ejemplo:');
      console.error('  sqlserver://localhost:1433;database=CompanyEmployees;user=sa;password=...;trustServerCertificate=true');
    }
    console.error('');
    console.error('Revise: servicio SQL en ejecución, TCP 1433 (netstat), usuario/contraseña,');
    console.error('        base de datos CompanyEmployees creada y trustServerCertificate=true.');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
