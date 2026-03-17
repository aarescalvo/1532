import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando carga de datos de prueba...\n')

  // 1. Configuración del frigorífico
  console.log('1. Configuración del frigorífico...')
  const config = await prisma.configuracionFrigorifico.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      nombre: 'SOLEMAR ALIMENTARIA S.A.',
      direccion: 'RUTA N° 22 - KM 1043 - CHIMPAY - RÍO NEGRO',
      numeroEstablecimiento: '3986',
      cuit: '30-70919450-6',
      numeroMatricula: '300'
    }
  })
  console.log('   ✓ Configuración creada\n')

  // 2. Operadores adicionales
  console.log('2. Operadores...')
  const operadores = [
    { nombre: 'Administrador', usuario: 'admin', password: 'admin123', rol: 'ADMINISTRADOR' },
    { nombre: 'Supervisor Turno Mañana', usuario: 'supervisor1', password: 'sup123', rol: 'SUPERVISOR' },
    { nombre: 'Operador Balanza', usuario: 'balanza', password: 'bal123', rol: 'OPERADOR' },
    { nombre: 'Operador Faena', usuario: 'faena', password: 'fae123', rol: 'OPERADOR' }
  ]

  for (const op of operadores) {
    const hashedPassword = await bcrypt.hash(op.password, 10)
    await prisma.operador.upsert({
      where: { usuario: op.usuario },
      update: {},
      create: {
        nombre: op.nombre,
        usuario: op.usuario,
        password: hashedPassword,
        rol: op.rol as any,
        activo: true,
        puedePesajeCamiones: true,
        puedePesajeIndividual: true,
        puedeMovimientoHacienda: true,
        puedeListaFaena: op.rol === 'ADMINISTRADOR' || op.rol === 'SUPERVISOR',
        puedeRomaneo: op.rol === 'ADMINISTRADOR' || op.rol === 'SUPERVISOR',
        puedeIngresoCajon: true,
        puedeMenudencias: true,
        puedeStock: true,
        puedeReportes: true,
        puedeCCIR: op.rol === 'ADMINISTRADOR',
        puedeFacturacion: op.rol === 'ADMINISTRADOR',
        puedeConfiguracion: op.rol === 'ADMINISTRADOR'
      }
    })
  }
  console.log('   ✓ 4 operadores creados\n')

  // 3. Clientes (Productores y Usuarios de Faena)
  console.log('3. Clientes...')
  const clientes = [
    { nombre: 'ESTANCIA SAN JORGE S.A.', cuit: '20-12345678-9', matricula: '100', esProductor: true, esUsuarioFaena: true },
    { nombre: 'LA ESPERANZA S.R.L.', cuit: '20-98765432-1', matricula: '101', esProductor: true, esUsuarioFaena: false },
    { nombre: 'JUAN CARLOS PEREZ', cuit: '20-11223344-5', matricula: '102', esProductor: false, esUsuarioFaena: true },
    { nombre: 'Ganaderos del Sur S.A.', cuit: '20-55667788-9', matricula: '103', esProductor: true, esUsuarioFaena: true },
    { nombre: 'MARIA ELENA GOMEZ', cuit: '27-99887766-5', matricula: '104', esProductor: false, esUsuarioFaena: true },
  ]

  for (const c of clientes) {
    await prisma.cliente.upsert({
      where: { cuit: c.cuit },
      update: {},
      create: {
        nombre: c.nombre,
        cuit: c.cuit,
        matricula: c.matricula,
        direccion: 'Chimpay, Río Negro',
        localidad: 'Chimpay',
        provincia: 'Río Negro',
        telefono: '02941-15XXXXXX',
        esProductor: c.esProductor,
        esUsuarioFaena: c.esUsuarioFaena,
        activo: true
      }
    })
  }
  console.log('   ✓ 5 clientes creados\n')

  // 4. Corrales
  console.log('4. Corrales...')
  const corrales = [
    { nombre: 'CORRAL A', capacidad: 50 },
    { nombre: 'CORRAL B', capacidad: 40 },
    { nombre: 'CORRAL C', capacidad: 60 },
    { nombre: 'CORRAL D', capacidad: 45 },
    { nombre: 'CORRAL E', capacidad: 55 }
  ]

  for (const c of corrales) {
    await prisma.corral.upsert({
      where: { nombre: c.nombre },
      update: {},
      create: {
        nombre: c.nombre,
        capacidad: c.capacidad,
        activo: true
      }
    })
  }
  console.log('   ✓ 5 corrales creados\n')

  // 5. Cámaras
  console.log('5. Cámaras...')
  const camaras = [
    { nombre: 'CÁMARA 1 - FAENA', tipo: 'FAENA', capacidad: 100 },
    { nombre: 'CÁMARA 2 - CUARTEO', tipo: 'CUARTEO', capacidad: 5000 },
    { nombre: 'CÁMARA 3 - DEPÓSITO', tipo: 'DEPOSITO', capacidad: 10000 }
  ]

  for (const c of camaras) {
    await prisma.camara.upsert({
      where: { nombre: c.nombre },
      update: {},
      create: {
        nombre: c.nombre,
        tipo: c.tipo as any,
        capacidad: c.capacidad,
        activo: true
      }
    })
  }
  console.log('   ✓ 3 cámaras creadas\n')

  // 6. Tipificadores
  console.log('6. Tipificadores...')
  const tipificadores = [
    { nombre: 'Carlos', apellido: 'Rodriguez', matricula: 'TIP-001' },
    { nombre: 'Miguel', apellido: 'Fernandez', matricula: 'TIP-002' }
  ]

  for (const t of tipificadores) {
    await prisma.tipificador.upsert({
      where: { matricula: t.matricula },
      update: {},
      create: {
        nombre: t.nombre,
        apellido: t.apellido,
        matricula: t.matricula,
        activo: true
      }
    })
  }
  console.log('   ✓ 2 tipificadores creados\n')

  // 7. Productos
  console.log('7. Productos...')
  const productos = [
    { codigo: '001', nombre: 'Media Res', especie: 'BOVINO', codigoTipificacion: '01', diasConservacion: 30 },
    { codigo: '002', nombre: 'Cuarto Delantero', especie: 'BOVINO', codigoTipificacion: '02', diasConservacion: 30 },
    { codigo: '003', nombre: 'Cuarto Trasero', especie: 'BOVINO', codigoTipificacion: '03', diasConservacion: 30 },
    { codigo: '010', nombre: 'Asado', especie: 'BOVINO', codigoTipificacion: '10', diasConservacion: 21 },
    { codigo: '011', nombre: 'Vacío', especie: 'BOVINO', codigoTipificacion: '11', diasConservacion: 21 },
  ]

  for (const p of productos) {
    await prisma.producto.upsert({
      where: { codigo_especie: { codigo: p.codigo, especie: p.especie as any } },
      update: {},
      create: {
        codigo: p.codigo,
        nombre: p.nombre,
        especie: p.especie as any,
        codigoTipificacion: p.codigoTipificacion,
        diasConservacion: p.diasConservacion,
        activo: true
      }
    })
  }
  console.log('   ✓ 5 productos creados\n')

  // 8. Códigos
  console.log('8. Códigos de referencia...')
  // Especies
  try {
    await prisma.codigoEspecie.create({ data: { codigo: '1', nombre: 'Bovino' } })
    await prisma.codigoEspecie.create({ data: { codigo: '6', nombre: 'Equino' } })
  } catch (e) { /* ya existe */ }

  // Transporte
  try {
    await prisma.codigoTransporte.create({ data: { codigo: '0', nombre: 'Camión' } })
    await prisma.codigoTransporte.create({ data: { codigo: '1', nombre: 'Barco Enfriado' } })
  } catch (e) { /* ya existe */ }

  // Destinos
  try {
    await prisma.codigoDestino.create({ data: { codigo: '00', nombre: 'Mercado Interno' } })
    await prisma.codigoDestino.create({ data: { codigo: '01', nombre: 'Chile' } })
    await prisma.codigoDestino.create({ data: { codigo: '02', nombre: 'Unión Europea' } })
  } catch (e) { /* ya existe */ }

  // Tipificación
  try {
    await prisma.codigoTipificacion.create({ data: { codigo: 'A', nombre: 'A - Bueno', especie: 'BOVINO' } })
    await prisma.codigoTipificacion.create({ data: { codigo: 'B', nombre: 'B - Regular', especie: 'BOVINO' } })
    await prisma.codigoTipificacion.create({ data: { codigo: 'C', nombre: 'C - Inferior', especie: 'BOVINO' } })
  } catch (e) { /* ya existe */ }
  console.log('   ✓ Códigos creados\n')

  // 9. Tropa con animales
  console.log('9. Tropa de prueba...')
  const productor = await prisma.cliente.findFirst({ where: { esProductor: true } })
  const usuarioFaena = await prisma.cliente.findFirst({ where: { esUsuarioFaena: true } })
  const corral = await prisma.corral.findFirst()

  if (productor && usuarioFaena && corral) {
    // Crear tropa
    const tropa = await prisma.tropa.create({
      data: {
        numero: 1,
        codigo: 'B 2026 0001',
        codigoSimplificado: 'B0001',
        productorId: productor.id,
        usuarioFaenaId: usuarioFaena.id,
        especie: 'BOVINO',
        dte: 'DTE-001-2026',
        guia: 'GUIA-001-2026',
        cantidadCabezas: 5,
        corralId: corral.id,
        estado: 'RECIBIDO'
      }
    })

    // Tipos de animales
    await prisma.tropaAnimalCantidad.createMany({
      data: [
        { tropaId: tropa.id, tipoAnimal: 'VA', cantidad: 2 },
        { tropaId: tropa.id, tipoAnimal: 'NO', cantidad: 2 },
        { tropaId: tropa.id, tipoAnimal: 'VQ', cantidad: 1 }
      ]
    })

    // Crear animales
    for (let i = 1; i <= 5; i++) {
      const tipoAnimal = i <= 2 ? 'VA' : i <= 4 ? 'NO' : 'VQ'
      await prisma.animal.create({
        data: {
          tropaId: tropa.id,
          numero: i,
          codigo: `B20260001-${String(i).padStart(3, '0')}`,
          tipoAnimal: tipoAnimal as any,
          pesoVivo: 400 + Math.random() * 100,
          estado: 'RECIBIDO',
          corralId: corral.id
        }
      })
    }

    // Actualizar stock del corral
    await prisma.corral.update({
      where: { id: corral.id },
      data: { stockBovinos: 5 }
    })

    console.log('   ✓ Tropa B 2026 0001 creada con 5 animales\n')
  }

  // 10. Lista de Faena
  console.log('10. Lista de Faena de prueba...')
  const operador = await prisma.operador.findFirst({ where: { rol: 'ADMINISTRADOR' } })
  
  if (operador && usuarioFaena) {
    const listaFaena = await prisma.listaFaena.create({
      data: {
        numero: 1,
        estado: 'ABIERTA',
        cantidadTotal: 5,
        supervisorId: operador.id
      }
    })

    // Asignar tropa a la lista
    const tropaCreada = await prisma.tropa.findFirst()
    if (tropaCreada && corral) {
      await prisma.listaFaenaTropa.create({
        data: {
          listaFaenaId: listaFaena.id,
          tropaId: tropaCreada.id,
          corralId: corral.id,
          cantidad: 5
        }
      })
    }
    console.log('   ✓ Lista de Faena #1 creada (ABIERTA)\n')
  }

  // 11. Rótulos por defecto
  console.log('11. Rótulos...')
  const rotulosExistentes = await prisma.rotulo.count()
  if (rotulosExistentes === 0) {
    const generarId = () => Math.random().toString(36).substr(2, 9)
    
    await prisma.rotulo.create({
      data: {
        nombre: 'Media Res - Estándar',
        codigo: 'MEDIA_RES',
        tipo: 'MEDIA_RES',
        categoria: 'ENVASE_PRIMARIO',
        ancho: 80,
        alto: 120,
        orientacion: 'vertical',
        elementos: JSON.stringify([
          { id: generarId(), tipo: 'texto', valor: 'ROTULO DEFINITIVO ENVASE PRIMARIO', x: 50, y: 2, ancho: 96, tamano: 8, negrita: true, alineacion: 'centro', visible: true },
          { id: generarId(), tipo: 'logo', x: 50, y: 8, ancho: 30, alto: 10, visible: true },
          { id: generarId(), tipo: 'texto', valor: 'ESTABLECIMIENTO FAENADOR', x: 50, y: 20, ancho: 96, tamano: 7, negrita: true, alineacion: 'centro', visible: true },
          { id: generarId(), tipo: 'campo_dinamico', campo: 'establecimiento', x: 50, y: 25, ancho: 96, tamano: 7, alineacion: 'centro', visible: true },
          { id: generarId(), tipo: 'separador', x: 50, y: 46, ancho: 90, visible: true },
          { id: generarId(), tipo: 'texto', valor: 'CARNE VACUNA CON HUESO ENFRIADA', x: 50, y: 50, ancho: 96, tamano: 7, negrita: true, alineacion: 'centro', visible: true },
          { id: generarId(), tipo: 'campo_dinamico', campo: 'nombreProducto', x: 50, y: 60, ancho: 96, tamano: 10, negrita: true, alineacion: 'centro', visible: true },
          { id: generarId(), tipo: 'separador', x: 50, y: 70, ancho: 90, visible: true },
          { id: generarId(), tipo: 'campo_dinamico', campo: 'fechaFaena', etiqueta: 'FECHA:', x: 10, y: 75, ancho: 45, tamano: 6, alineacion: 'izquierda', visible: true },
          { id: generarId(), tipo: 'campo_dinamico', campo: 'tropa', etiqueta: 'TROPA:', x: 55, y: 75, ancho: 45, tamano: 6, alineacion: 'izquierda', visible: true },
          { id: generarId(), tipo: 'campo_dinamico', campo: 'garron', etiqueta: 'GARRON:', x: 10, y: 80, ancho: 45, tamano: 6, alineacion: 'izquierda', visible: true },
          { id: generarId(), tipo: 'campo_dinamico', campo: 'peso', etiqueta: 'PESO:', x: 55, y: 80, ancho: 45, tamano: 6, negrita: true, alineacion: 'izquierda', visible: true },
          { id: generarId(), tipo: 'separador', x: 50, y: 88, ancho: 90, visible: true },
          { id: generarId(), tipo: 'texto', valor: 'MANTENER REFRIGERADO A MENOS DE 5°C', x: 50, y: 92, ancho: 96, tamano: 5, alineacion: 'centro', visible: true },
        ]),
        fuentePrincipal: 'Arial',
        tamanoFuenteBase: 7,
        colorTexto: '#000000',
        incluyeSenasa: true,
        temperaturaMax: 5,
        diasConsumo: 30,
        activo: true,
        esDefault: true
      }
    })
    console.log('   ✓ Rótulo Media Res creado\n')
  } else {
    console.log('   ✓ Rótulos ya existen\n')
  }

  console.log('═════════════════════════════════════════════════════')
  console.log('✅ DATOS DE PRUEBA CARGADOS EXITOSAMENTE')
  console.log('═════════════════════════════════════════════════════')
  console.log('\n📋 CREDENCIALES DE ACCESO:')
  console.log('   Usuario: admin | Password: admin123 (Administrador)')
  console.log('   Usuario: supervisor1 | Password: sup123 (Supervisor)')
  console.log('   Usuario: balanza | Password: bal123 (Operador)')
  console.log('   Usuario: faena | Password: fae123 (Operador)')
  console.log('\n📦 DATOS CREADOS:')
  console.log('   • 4 operadores')
  console.log('   • 5 clientes (productores y usuarios de faena)')
  console.log('   • 5 corrales')
  console.log('   • 3 cámaras')
  console.log('   • 2 tipificadores')
  console.log('   • 5 productos')
  console.log('   • 1 tropa con 5 animales')
  console.log('   • 1 lista de faena abierta')
  console.log('   • Rótulos configurados')
  console.log('═════════════════════════════════════════════════════')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
