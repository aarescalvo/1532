import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener animales de la lista de faena activa (abierta o cerrada del día)
export async function GET(request: NextRequest) {
  try {
    console.log('[animales-hoy] Buscando lista de faena activa...')

    // Buscar la lista de faena más reciente que tenga tropas asignadas
    // Puede estar ABIERTA, EN_PROCESO o CERRADA
    // Una vez cerrada, los animales deben estar disponibles para ingreso a cajón
    const listaFaena = await db.listaFaena.findFirst({
      where: {
        estado: { in: ['ABIERTA', 'EN_PROCESO', 'CERRADA'] },
        tropas: {
          some: {} // Solo listas que tienen tropas asignadas
        }
      },
      include: {
        tropas: {
          include: {
            tropa: {
              include: {
                usuarioFaena: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('[animales-hoy] Lista encontrada:', listaFaena?.id, 'Estado:', listaFaena?.estado, 'Tropas:', listaFaena?.tropas.length)

    if (!listaFaena || listaFaena.tropas.length === 0) {
      console.log('[animales-hoy] No hay lista de faena con tropas asignadas')
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Obtener IDs de las tropas en la lista y las cantidades asignadas
    const tropasEnLista = listaFaena.tropas.map(lt => ({
      tropaId: lt.tropaId,
      cantidad: lt.cantidad,
      corralId: lt.corralId
    }))

    console.log('[animales-hoy] Tropas en lista:', tropasEnLista.length)

    // Buscar animales de esas tropas
    // Por ahora traemos todos los animales de las tropas asignadas
    const animales = await db.animal.findMany({
      where: {
        tropaId: { in: tropasEnLista.map(t => t.tropaId) }
      },
      include: {
        tropa: {
          select: {
            codigo: true,
            usuarioFaena: { select: { nombre: true } }
          }
        },
        pesajeIndividual: { select: { peso: true } },
        asignacionGarron: { select: { garron: true } }
      },
      orderBy: [
        { tropa: { codigo: 'asc' } },
        { numero: 'asc' }
      ]
    })

    console.log('[animales-hoy] Animales encontrados:', animales.length)

    // Formatear respuesta
    const data = animales.map(animal => ({
      id: animal.id,
      codigo: animal.codigo,
      tropaCodigo: animal.tropa?.codigo || null,
      tipoAnimal: animal.tipoAnimal?.toString() || null,
      pesoVivo: animal.pesoVivo || animal.pesajeIndividual?.peso || null,
      numero: animal.numero,
      garronAsignado: animal.asignacionGarron?.garron || null,
      estado: animal.estado
    }))

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Error obteniendo animales de lista de faena:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener animales' },
      { status: 500 }
    )
  }
}
