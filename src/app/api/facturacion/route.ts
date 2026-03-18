import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener datos para facturación
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') || 'despachos-pendientes'

    switch (tipo) {
      case 'despachos-pendientes':
        return await getDespachosPendientes()
      case 'despacho':
        return await getDespachoParaFacturar(searchParams.get('id'))
      case 'facturas':
        return await getFacturas(searchParams)
      case 'factura':
        return await getFacturaById(searchParams.get('id'))
      case 'precios-cliente':
        return await getPreciosCliente(searchParams.get('clienteId'))
      case 'clientes':
        return await getClientesUsuarioFaena()
      default:
        return NextResponse.json({ success: false, error: 'Tipo no válido' }, { status: 400 })
    }
  } catch (error) {
    console.error('[Facturación API] Error:', error)
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 })
  }
}

// Obtener despachos pendientes de facturar
async function getDespachosPendientes() {
  const despachos = await db.despacho.findMany({
    where: {
      estado: 'DESPACHADO',
      factura: null // Sin factura asociada
    },
    include: {
      items: {
        select: {
          usuarioId: true,
          usuarioNombre: true,
          peso: true
        }
      },
      operador: { select: { nombre: true } }
    },
    orderBy: { fecha: 'desc' },
    take: 50
  })

  // Agrupar usuarios por despacho
  const despachosConUsuarios = despachos.map(d => {
    const usuariosMap = new Map<string, { usuarioId: string | null; usuarioNombre: string; kgTotal: number }>()
    
    for (const item of d.items) {
      const key = item.usuarioId || 'sin-usuario'
      if (!usuariosMap.has(key)) {
        usuariosMap.set(key, {
          usuarioId: item.usuarioId,
          usuarioNombre: item.usuarioNombre || 'Sin usuario',
          kgTotal: 0
        })
      }
      usuariosMap.get(key)!.kgTotal += item.peso
    }

    return {
      id: d.id,
      numero: d.numero,
      fecha: d.fecha,
      destino: d.destino,
      patenteCamion: d.patenteCamion,
      chofer: d.chofer,
      remito: d.remito,
      kgTotal: d.kgTotal,
      cantidadMedias: d.cantidadMedias,
      operador: d.operador?.nombre,
      usuarios: Array.from(usuariosMap.values())
    }
  })

  return NextResponse.json({ success: true, data: despachosConUsuarios })
}

// Obtener despacho para facturar con detalle de usuarios
async function getDespachoParaFacturar(id: string | null) {
  if (!id) {
    return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
  }

  const despacho = await db.despacho.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          mediaRes: {
            include: {
              romaneo: { select: { tropaCodigo: true, garron: true } }
            }
          }
        }
      },
      operador: { select: { nombre: true } },
      ticketPesaje: { select: { numeroTicket: true, pesoBruto: true, pesoTara: true, pesoNeto: true } }
    }
  })

  if (!despacho) {
    return NextResponse.json({ success: false, error: 'Despacho no encontrado' }, { status: 404 })
  }

  // Agrupar por usuario
  const usuariosMap = new Map<string, { 
    usuarioId: string | null; 
    usuarioNombre: string; 
    cantidadMedias: number; 
    kgTotal: number;
    precioKg: number | null;
    subtotal: number;
  }>()

  for (const item of despacho.items) {
    const key = item.usuarioId || 'sin-usuario'
    if (!usuariosMap.has(key)) {
      usuariosMap.set(key, {
        usuarioId: item.usuarioId,
        usuarioNombre: item.usuarioNombre || 'Sin usuario',
        cantidadMedias: 0,
        kgTotal: 0,
        precioKg: null,
        subtotal: 0
      })
    }
    const usuario = usuariosMap.get(key)!
    usuario.cantidadMedias++
    usuario.kgTotal += item.peso
  }

  return NextResponse.json({
    success: true,
    data: {
      ...despacho,
      usuarios: Array.from(usuariosMap.values())
    }
  })
}

// Obtener lista de facturas
async function getFacturas(searchParams: URLSearchParams) {
  const estado = searchParams.get('estado')
  const clienteId = searchParams.get('clienteId')
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')
  const search = searchParams.get('search')

  const where: Record<string, unknown> = {}
  
  if (estado && estado !== 'TODOS') where.estado = estado
  if (clienteId) where.clienteId = clienteId
  
  if (desde || hasta) {
    where.fecha = {}
    if (desde) where.fecha = { ...where.fecha, gte: new Date(desde) }
    if (hasta) {
      const hastaDate = new Date(hasta)
      hastaDate.setHours(23, 59, 59, 999)
      where.fecha = { ...where.fecha, lte: hastaDate }
    }
  }
  
  if (search) {
    where.OR = [
      { numero: { contains: search } },
      { cliente: { nombre: { contains: search } } }
    ]
  }

  const facturas = await db.factura.findMany({
    where,
    include: {
      cliente: {
        select: {
          id: true,
          nombre: true,
          cuit: true,
          matricula: true
        }
      },
      detalles: {
        select: {
          tipoProducto: true,
          descripcion: true,
          cantidad: true,
          pesoKg: true,
          precioUnitario: true,
          subtotal: true
        }
      },
      operador: { select: { nombre: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  })

  return NextResponse.json({ success: true, data: facturas })
}

// Obtener factura por ID
async function getFacturaById(id: string | null) {
  if (!id) {
    return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
  }

  const factura = await db.factura.findUnique({
    where: { id },
    include: {
      cliente: true,
      detalles: true,
      operador: { select: { nombre: true } }
    }
  })

  if (!factura) {
    return NextResponse.json({ success: false, error: 'Factura no encontrada' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: factura })
}

// Obtener precios por cliente
async function getPreciosCliente(clienteId: string | null) {
  if (!clienteId) {
    return NextResponse.json({ success: false, error: 'clienteId requerido' }, { status: 400 })
  }

  const precios = await db.precioCliente.findMany({
    where: {
      clienteId,
      activo: true,
      OR: [
        { fechaHasta: null },
        { fechaHasta: { gte: new Date() } }
      ]
    },
    orderBy: { tipoProducto: 'asc' }
  })

  return NextResponse.json({ success: true, data: precios })
}

// Obtener clientes usuario de faena
async function getClientesUsuarioFaena() {
  const clientes = await db.cliente.findMany({
    where: {
      esUsuarioFaena: true,
      activo: true
    },
    select: {
      id: true,
      nombre: true,
      cuit: true,
      matricula: true,
      razonSocial: true,
      condicionIva: true,
      localidad: true
    },
    orderBy: { nombre: 'asc' }
  })

  return NextResponse.json({ success: true, data: clientes })
}

// POST - Crear/actualizar facturas
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accion, ...data } = body

    switch (accion) {
      case 'crear-desde-despacho':
        return await crearFacturaDesdeDespacho(data)
      case 'crear-otros-items':
        return await crearFacturaOtrosItems(data)
      case 'actualizar':
        return await actualizarFactura(data)
      case 'anular':
        return await anularFactura(data)
      case 'guardar-precio':
        return await guardarPrecioCliente(data)
      default:
        return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 })
    }
  } catch (error) {
    console.error('[Facturación API] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error del servidor: ' + (error instanceof Error ? error.message : 'Error desconocido') 
    }, { status: 500 })
  }
}

// Crear factura desde despacho
async function crearFacturaDesdeDespacho(data: {
  despachoId: string
  clienteId: string
  detalles: Array<{
    tipoProducto: string
    descripcion: string
    cantidad: number
    pesoKg: number
    precioUnitario: number
  }>
  observaciones?: string
  operadorId?: string
}) {
  // Verificar que el despacho existe y no tiene factura
  const despacho = await db.despacho.findUnique({
    where: { id: data.despachoId }
  })

  if (!despacho) {
    return NextResponse.json({ success: false, error: 'Despacho no encontrado' }, { status: 404 })
  }

  // Calcular totales
  let subtotal = 0
  const detallesCalculados = data.detalles.map(d => {
    const subtotalItem = d.pesoKg * d.precioUnitario
    subtotal += subtotalItem
    return {
      ...d,
      subtotal: subtotalItem
    }
  })

  const iva = subtotal * 0.21 // IVA 21%
  const total = subtotal + iva

  // Obtener siguiente número de factura
  const numerador = await db.numerador.upsert({
    where: { nombre: 'FACTURA' },
    update: { ultimoNumero: { increment: 1 } },
    create: { nombre: 'FACTURA', ultimoNumero: 1 }
  })
  
  const numeroInterno = numerador.ultimoNumero
  const numero = String(numeroInterno).padStart(8, '0')

  // Crear la factura
  const factura = await db.factura.create({
    data: {
      numero,
      numeroInterno,
      clienteId: data.clienteId,
      subtotal,
      iva,
      total,
      observaciones: data.observaciones,
      remito: despacho.remito || undefined,
      operadorId: data.operadorId,
      detalles: {
        create: detallesCalculados.map(d => ({
          tipoProducto: d.tipoProducto as 'MEDIA_RES' | 'CUARTO_DELANTERO' | 'CUARTO_TRASERO' | 'MENUDENCIA' | 'OTRO',
          descripcion: d.descripcion,
          cantidad: d.cantidad,
          unidad: 'KG',
          pesoKg: d.pesoKg,
          precioUnitario: d.precioUnitario,
          subtotal: d.subtotal
        }))
      }
    },
    include: {
      cliente: true,
      detalles: true
    }
  })

  return NextResponse.json({
    success: true,
    data: factura,
    message: `Factura #${numero} creada correctamente`
  })
}

// Crear factura de otros items
async function crearFacturaOtrosItems(data: {
  clienteId: string
  items: Array<{
    tipoProducto: string
    descripcion: string
    cantidad: number
    unidad: string
    pesoKg?: number
    precioUnitario: number
  }>
  observaciones?: string
  operadorId?: string
}) {
  // Calcular totales
  let subtotal = 0
  const detallesCalculados = data.items.map(item => {
    const cantidad = item.unidad === 'KG' ? (item.pesoKg || item.cantidad) : item.cantidad
    const subtotalItem = cantidad * item.precioUnitario
    subtotal += subtotalItem
    return {
      tipoProducto: item.tipoProducto as 'MEDIA_RES' | 'CUARTO_DELANTERO' | 'CUARTO_TRASERO' | 'MENUDENCIA' | 'OTRO',
      descripcion: item.descripcion,
      cantidad,
      unidad: item.unidad,
      pesoKg: item.pesoKg,
      precioUnitario: item.precioUnitario,
      subtotal: subtotalItem
    }
  })

  const iva = subtotal * 0.21
  const total = subtotal + iva

  // Obtener siguiente número de factura
  const numerador = await db.numerador.upsert({
    where: { nombre: 'FACTURA' },
    update: { ultimoNumero: { increment: 1 } },
    create: { nombre: 'FACTURA', ultimoNumero: 1 }
  })
  
  const numeroInterno = numerador.ultimoNumero
  const numero = String(numeroInterno).padStart(8, '0')

  // Crear la factura
  const factura = await db.factura.create({
    data: {
      numero,
      numeroInterno,
      clienteId: data.clienteId,
      subtotal,
      iva,
      total,
      observaciones: data.observaciones,
      operadorId: data.operadorId,
      detalles: {
        create: detallesCalculados
      }
    },
    include: {
      cliente: true,
      detalles: true
    }
  })

  return NextResponse.json({
    success: true,
    data: factura,
    message: `Factura #${numero} creada correctamente`
  })
}

// Actualizar factura
async function actualizarFactura(data: {
  facturaId: string
  detalles?: Array<{
    id?: string
    tipoProducto: string
    descripcion: string
    cantidad: number
    pesoKg?: number
    precioUnitario: number
  }>
  observaciones?: string
}) {
  const factura = await db.factura.findUnique({
    where: { id: data.facturaId }
  })

  if (!factura) {
    return NextResponse.json({ success: false, error: 'Factura no encontrada' }, { status: 404 })
  }

  if (factura.estado === 'ANULADA') {
    return NextResponse.json({ success: false, error: 'No se puede modificar una factura anulada' }, { status: 400 })
  }

  // Si hay detalles, actualizar
  if (data.detalles) {
    // Eliminar detalles existentes
    await db.detalleFactura.deleteMany({
      where: { facturaId: data.facturaId }
    })

    // Crear nuevos detalles
    let subtotal = 0
    const nuevosDetalles = data.detalles.map(d => {
      const subtotalItem = (d.pesoKg || d.cantidad) * d.precioUnitario
      subtotal += subtotalItem
      return {
        facturaId: data.facturaId,
        tipoProducto: d.tipoProducto as 'MEDIA_RES' | 'CUARTO_DELANTERO' | 'CUARTO_TRASERO' | 'MENUDENCIA' | 'OTRO',
        descripcion: d.descripcion,
        cantidad: d.cantidad,
        unidad: 'KG',
        pesoKg: d.pesoKg,
        precioUnitario: d.precioUnitario,
        subtotal: subtotalItem
      }
    })

    await db.detalleFactura.createMany({
      data: nuevosDetalles
    })

    const iva = subtotal * 0.21
    const total = subtotal + iva

    await db.factura.update({
      where: { id: data.facturaId },
      data: {
        subtotal,
        iva,
        total,
        observaciones: data.observaciones
      }
    })
  } else if (data.observaciones) {
    await db.factura.update({
      where: { id: data.facturaId },
      data: { observaciones: data.observaciones }
    })
  }

  const facturaActualizada = await db.factura.findUnique({
    where: { id: data.facturaId },
    include: { cliente: true, detalles: true }
  })

  return NextResponse.json({
    success: true,
    data: facturaActualizada,
    message: 'Factura actualizada correctamente'
  })
}

// Anular factura
async function anularFactura(data: { facturaId: string }) {
  const factura = await db.factura.findUnique({
    where: { id: data.facturaId }
  })

  if (!factura) {
    return NextResponse.json({ success: false, error: 'Factura no encontrada' }, { status: 404 })
  }

  if (factura.estado === 'ANULADA') {
    return NextResponse.json({ success: false, error: 'La factura ya está anulada' }, { status: 400 })
  }

  await db.factura.update({
    where: { id: data.facturaId },
    data: { estado: 'ANULADA' }
  })

  return NextResponse.json({
    success: true,
    message: `Factura #${factura.numero} anulada correctamente`
  })
}

// Guardar precio de cliente
async function guardarPrecioCliente(data: {
  clienteId: string
  tipoProducto: string
  precioKg: number
  operadorId?: string
}) {
  // Desactivar precio anterior si existe
  await db.precioCliente.updateMany({
    where: {
      clienteId: data.clienteId,
      tipoProducto: data.tipoProducto as 'MEDIA_RES_BOVINA' | 'MEDIA_RES_EQUINA' | 'CUARTO_DELANTERO' | 'CUARTO_TRASERO' | 'MENUDENCIA' | 'SERVICIO_DESPOSTE' | 'SERVICIO_FRIO' | 'CARNE_CORTE' | 'OTRO',
      activo: true
    },
    data: {
      activo: false,
      fechaHasta: new Date()
    }
  })

  // Crear nuevo precio
  const precio = await db.precioCliente.create({
    data: {
      clienteId: data.clienteId,
      tipoProducto: data.tipoProducto as 'MEDIA_RES_BOVINA' | 'MEDIA_RES_EQUINA' | 'CUARTO_DELANTERO' | 'CUARTO_TRASERO' | 'MENUDENCIA' | 'SERVICIO_DESPOSTE' | 'SERVICIO_FRIO' | 'CARNE_CORTE' | 'OTRO',
      precioKg: data.precioKg
    }
  })

  return NextResponse.json({
    success: true,
    data: precio,
    message: 'Precio guardado correctamente'
  })
}
