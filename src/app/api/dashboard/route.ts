import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cacheOrFetch, cacheInvalidate, CACHE_KEYS, CACHE_TTL } from '@/lib/cache'
import { createLogger } from '@/lib/logger'

const logger = createLogger('API:Dashboard')

// GET - Fetch dashboard stats con cache
export async function GET() {
  try {
    const endTimer = logger.time('Dashboard stats')
    
    // Usar cache para estadísticas (30 segundos TTL)
    const stats = await cacheOrFetch(
      CACHE_KEYS.DASHBOARD_STATS,
      async () => {
        logger.debug('Cache miss - obteniendo stats de BD')
        
        const [tropasActivas, pesajesHoy, enCamara] = await Promise.all([
          db.tropa.count({
            where: { estado: 'RECIBIDO' }
          }),
          db.pesajeCamion.count({
            where: {
              createdAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0))
              }
            }
          }),
          db.stockMediaRes.count()
        ])
        
        return {
          tropasActivas,
          enPesaje: 0,
          pesajesHoy,
          enCamara,
          kgRomaneoHoy: 0,
          ultimasTropas: []
        }
      },
      CACHE_TTL.SHORT // 30 segundos
    )
    
    endTimer()
    logger.debug('Stats obtenidas', stats)
    
    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    logger.error('Error al obtener estadísticas', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}

// Invalidar cache cuando hay cambios
export function invalidateDashboardCache() {
  cacheInvalidate('dashboard:')
}
