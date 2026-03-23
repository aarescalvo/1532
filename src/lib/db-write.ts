import { PrismaClient } from '@prisma/client'

/**
 * Crea un cliente Prisma fresco para operaciones de escritura.
 * Esto evita problemas con conexiones en modo solo lectura que persisten
 * después de cambios de permisos en la base de datos.
 */
export function getWriteClient() {
  return new PrismaClient({
    log: ['query'],
    datasourceUrl: 'file:/home/z/my-project/db/custom.db'
  })
}

/**
 * Ejecuta una operación de escritura con un cliente fresco,
 * asegurando que la conexión se cierre correctamente.
 */
export async function withWriteClient<T>(
  operation: (db: PrismaClient) => Promise<T>
): Promise<T> {
  const db = getWriteClient()
  try {
    return await operation(db)
  } finally {
    await db.$disconnect()
  }
}
