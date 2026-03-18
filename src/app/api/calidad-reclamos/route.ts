import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

// GET - Listar reclamos con filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get('clienteId')
    const tipo = searchParams.get('tipo')
    const estado = searchParams.get('estado')
    const prioridad = searchParams.get('prioridad')
    const pendientes = searchParams.get('pendientes')
    const busqueda = searchParams.get('busqueda')
    const id = searchParams.get('id')

    // Si se pide un reclamo específico
    if (id) {
      const reclamo = await db.reclamoCliente.findUnique({
        where: { id },
        include: {
          cliente: {
            select: {
              id: true,
              nombre: true,
              cuit: true,
              telefono: true,
              email: true,
              esUsuarioFaena: true
            }
          },
          respuestas: {
            orderBy: { fecha: 'desc' },
            include: {
              archivos: true
            }
          },
          archivos: {
            where: { respuestaId: null } // Solo archivos del reclamo principal
          }
        }
      })

      return NextResponse.json({
        success: true,
        data: reclamo
      })
    }

    const where: Record<string, unknown> = {}

    if (clienteId) {
      where.clienteId = clienteId
    }
    if (tipo && tipo !== 'TODOS') {
      where.tipo = tipo
    }
    if (estado && estado !== 'TODOS') {
      where.estado = estado
    }
    if (prioridad && prioridad !== 'TODOS') {
      where.prioridad = prioridad
    }
    if (pendientes === 'true') {
      where.estado = { in: ['PENDIENTE', 'EN_REVISION'] }
    }
    if (busqueda) {
      where.OR = [
        { titulo: { contains: busqueda } },
        { descripcion: { contains: busqueda } },
        { cliente: { nombre: { contains: busqueda } } }
      ]
    }

    const reclamos = await db.reclamoCliente.findMany({
      where,
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            cuit: true,
            telefono: true,
            email: true,
            esUsuarioFaena: true
          }
        },
        _count: {
          select: {
            respuestas: true,
            archivos: true
          }
        }
      },
      orderBy: [
        { prioridad: 'desc' },
        { fecha: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: reclamos
    })

  } catch (error) {
    console.error('[Calidad Reclamos API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener reclamos' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo reclamo con archivos opcionales
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.clienteId || !data.titulo || !data.tipo) {
      return NextResponse.json(
        { success: false, error: 'Cliente, título y tipo son requeridos' },
        { status: 400 }
      )
    }

    // Crear el reclamo
    const reclamo = await db.reclamoCliente.create({
      data: {
        id: randomUUID(),
        clienteId: data.clienteId,
        tipo: data.tipo,
        titulo: data.titulo,
        descripcion: data.descripcion || null,
        fecha: data.fecha ? new Date(data.fecha) : new Date(),
        tropaCodigo: data.tropaCodigo || null,
        registradoPor: data.registradoPor || null,
        estado: data.estado || 'PENDIENTE',
        prioridad: data.prioridad || 'NORMAL',
        observaciones: data.observaciones || null,
        updatedAt: new Date()
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            cuit: true
          }
        }
      }
    })

    // Si hay archivos adjuntos, crearlos
    if (data.archivos && Array.isArray(data.archivos) && data.archivos.length > 0) {
      for (const archivo of data.archivos) {
        await db.archivoReclamo.create({
          data: {
            id: randomUUID(),
            reclamoId: reclamo.id,
            nombre: archivo.nombre,
            nombreInterno: `reclamo_${reclamo.id}_${Date.now()}_${archivo.nombre}`,
            tipo: archivo.tipo || 'OTRO',
            mimeType: archivo.mimeType,
            tamaño: archivo.tamaño,
            contenido: archivo.contenido, // Base64
            subidoPor: data.registradoPor,
            operadorId: data.operadorId,
            descripcion: archivo.descripcion
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: reclamo
    })

  } catch (error) {
    console.error('[Calidad Reclamos API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al crear reclamo' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar reclamo o agregar respuesta
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()

    if (!data.id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }

    // Si es una nueva respuesta
    if (data.nuevaRespuesta) {
      const respuesta = await db.respuestaReclamo.create({
        data: {
          id: randomUUID(),
          reclamoId: data.id,
          mensaje: data.nuevaRespuesta.mensaje,
          tipo: data.nuevaRespuesta.tipo || 'RESPUESTA_CLIENTE',
          autorId: data.nuevaRespuesta.autorId,
          autorNombre: data.nuevaRespuesta.autorNombre
        },
        include: {
          archivos: true
        }
      })

      // Si hay archivos en la respuesta
      if (data.nuevaRespuesta.archivos && Array.isArray(data.nuevaRespuesta.archivos)) {
        for (const archivo of data.nuevaRespuesta.archivos) {
          await db.archivoReclamo.create({
            data: {
              id: randomUUID(),
              reclamoId: data.id,
              respuestaId: respuesta.id,
              nombre: archivo.nombre,
              nombreInterno: `respuesta_${respuesta.id}_${Date.now()}_${archivo.nombre}`,
              tipo: archivo.tipo || 'OTRO',
              mimeType: archivo.mimeType,
              tamaño: archivo.tamaño,
              contenido: archivo.contenido,
              subidoPor: data.nuevaRespuesta.autorNombre,
              operadorId: data.nuevaRespuesta.autorId,
              descripcion: archivo.descripcion
            }
          })
        }
      }

      // Actualizar el reclamo principal
      const updateData: Record<string, unknown> = {
        updatedAt: new Date()
      }

      // Si es respuesta al cliente, actualizar campos de respuesta
      if (data.nuevaRespuesta.tipo === 'RESPUESTA_CLIENTE') {
        updateData.respuesta = data.nuevaRespuesta.mensaje
        updateData.fechaRespuesta = new Date()
        updateData.respondidoPor = data.nuevaRespuesta.autorNombre
        updateData.estado = 'RESPONDIDO'
      }

      // Si es cierre
      if (data.nuevaRespuesta.tipo === 'CIERRE') {
        updateData.estado = 'RESUELTO'
        updateData.fechaResolucion = new Date()
        updateData.resueltoPor = data.nuevaRespuesta.autorNombre
        updateData.resultado = data.nuevaRespuesta.resultado || 'RESUELTO'
      }

      await db.reclamoCliente.update({
        where: { id: data.id },
        data: updateData
      })

      return NextResponse.json({
        success: true,
        data: respuesta
      })
    }

    // Actualización normal del reclamo
    const updateData: Record<string, unknown> = {
      updatedAt: new Date()
    }

    // Campos actualizables
    if (data.tipo) updateData.tipo = data.tipo
    if (data.titulo) updateData.titulo = data.titulo
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion || null
    if (data.tropaCodigo !== undefined) updateData.tropaCodigo = data.tropaCodigo || null
    if (data.estado) updateData.estado = data.estado
    if (data.prioridad) updateData.prioridad = data.prioridad
    if (data.seguimiento !== undefined) updateData.seguimiento = data.seguimiento || null
    if (data.observaciones !== undefined) updateData.observaciones = data.observaciones || null

    // Resolución
    if (data.estado === 'RESUELTO' || data.estado === 'CERRADO') {
      updateData.fechaResolucion = new Date()
      updateData.resueltoPor = data.resueltoPor || null
      updateData.resultado = data.resultado || null
    }

    const reclamo = await db.reclamoCliente.update({
      where: { id: data.id },
      data: updateData,
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            cuit: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: reclamo
    })

  } catch (error) {
    console.error('[Calidad Reclamos API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar reclamo' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar reclamo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const archivoId = searchParams.get('archivoId')
    const respuestaId = searchParams.get('respuestaId')

    // Eliminar archivo específico
    if (archivoId) {
      await db.archivoReclamo.delete({
        where: { id: archivoId }
      })
      return NextResponse.json({
        success: true,
        message: 'Archivo eliminado correctamente'
      })
    }

    // Eliminar respuesta específica
    if (respuestaId) {
      await db.respuestaReclamo.delete({
        where: { id: respuestaId }
      })
      return NextResponse.json({
        success: true,
        message: 'Respuesta eliminada correctamente'
      })
    }

    // Eliminar reclamo completo
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requerido' },
        { status: 400 }
      )
    }

    await db.reclamoCliente.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Reclamo eliminado correctamente'
    })

  } catch (error) {
    console.error('[Calidad Reclamos API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar' },
      { status: 500 }
    )
  }
}
