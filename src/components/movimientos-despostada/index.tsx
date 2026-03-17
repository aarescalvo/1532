'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  RefreshCw, ArrowRightLeft, Loader2, Package
} from 'lucide-react'
import { TextoEditable, EditableBlock, useEditor } from '@/components/ui/editable-screen'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface MovimientoDespostada {
  id: string
  fecha: string
  producto: string
  origen: string
  destino: string
  pesoKg: number
  operador: string
  estado: 'PENDIENTE' | 'EN_TRANSITO' | 'COMPLETADO'
  tipoMovimiento: 'INTERNO' | 'ENTRADA' | 'SALIDA'
}

interface Props {
  operador: Operador
}

const ESTACIONES = [
  'Despostada 1',
  'Despostada 2',
  'Despostada 3',
  'Cámara 1',
  'Cámara 2',
  'Cámara 3',
  'Área de Empaque',
  'Área de Empacado',
  'Control de Calidad',
  'Expedición'
]

const PRODUCTOS_EJEMPLO = [
  'Nalga',
  'Bola',
  'Cuadril',
  'Brazuelo',
  'Paleta',
  'Asado',
  'Picada',
  'Carne Molida'
]

export function MovimientosDespostadaModule({ operador }: Props) {
  const { editMode, getTexto } = useEditor()
  const [movimientos, setMovimientos] = useState<MovimientoDespostada[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'PENDIENTE' | 'EN_TRANSITO' | 'COMPLETADO'>('TODOS')
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'INTERNO' | 'ENTRADA' | 'SALIDA'>('TODOS')
  
  // Form state
  const [producto, setProducto] = useState('')
  const [origen, setOrigen] = useState('')
  const [destino, setDestino] = useState('')
  const [pesoKg, setPesoKg] = useState('')
  const [tipoMovimiento, setTipoMovimiento] = useState<'INTERNO' | 'ENTRADA' | 'SALIDA'>('INTERNO')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchMovimientos()
  }, [])

  const fetchMovimientos = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setMovimientos([
        {
          id: '1',
          fecha: new Date().toISOString(),
          producto: 'Nalga',
          origen: 'Despostada 1',
          destino: 'Cámara 1',
          pesoKg: 125.5,
          operador: 'Juan Pérez',
          estado: 'PENDIENTE',
          tipoMovimiento: 'INTERNO'
        },
        {
          id: '2',
          fecha: new Date().toISOString(),
          producto: 'Bola',
          origen: 'Despostada 2',
          destino: 'Área de Empaque',
          pesoKg: 85.0,
          operador: 'María García',
          estado: 'EN_TRANSITO',
          tipoMovimiento: 'INTERNO'
        },
        {
          id: '3',
          fecha: new Date(Date.now() - 3600000).toISOString(),
          producto: 'Cuadril',
          origen: 'Cámara 1',
          destino: 'Despostada 1',
          pesoKg: 210.0,
          operador: 'Carlos López',
          estado: 'COMPLETADO',
          tipoMovimiento: 'ENTRADA'
        },
        {
          id: '4',
          fecha: new Date(Date.now() - 7200000).toISOString(),
          producto: 'Paleta',
          origen: 'Despostada 3',
          destino: 'Expedición',
          pesoKg: 75.3,
          operador: 'Ana Rodríguez',
          estado: 'COMPLETADO',
          tipoMovimiento: 'SALIDA'
        },
        {
          id: '5',
          fecha: new Date(Date.now() - 1800000).toISOString(),
          producto: 'Asado',
          origen: 'Despostada 1',
          destino: 'Cámara 2',
          pesoKg: 180.0,
          operador: 'Pedro Martínez',
          estado: 'EN_TRANSITO',
          tipoMovimiento: 'INTERNO'
        },
        {
          id: '6',
          fecha: new Date(Date.now() - 5400000).toISOString(),
          producto: 'Picada',
          origen: 'Área de Empaque',
          destino: 'Expedición',
          pesoKg: 50.0,
          operador: 'Laura Sánchez',
          estado: 'PENDIENTE',
          tipoMovimiento: 'SALIDA'
        }
      ])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar movimientos')
    } finally {
      setLoading(false)
    }
  }

  const handleCambiarEstado = async (id: string, nuevoEstado: 'EN_TRANSITO' | 'COMPLETADO') => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setMovimientos(movimientos.map(m => 
        m.id === id ? { ...m, estado: nuevoEstado } : m
      ))
      
      toast.success(`Movimiento actualizado a ${nuevoEstado.replace('_', ' ')}`)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar movimiento')
    }
  }

  const handleNuevoMovimiento = async () => {
    if (!producto || !origen || !destino || !pesoKg) {
      toast.error('Complete todos los campos obligatorios')
      return
    }

    if (origen === destino) {
      toast.error('El origen y destino deben ser diferentes')
      return
    }

    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const nuevoMovimiento: MovimientoDespostada = {
        id: Date.now().toString(),
        fecha: new Date().toISOString(),
        producto,
        origen,
        destino,
        pesoKg: parseFloat(pesoKg),
        operador: operador.nombre,
        estado: 'PENDIENTE',
        tipoMovimiento
      }
      
      setMovimientos([nuevoMovimiento, ...movimientos])
      setProducto('')
      setOrigen('')
      setDestino('')
      setPesoKg('')
      setTipoMovimiento('INTERNO')
      toast.success('Movimiento registrado correctamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al registrar movimiento')
    } finally {
      setSaving(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Badge className="bg-amber-100 text-amber-700 border border-amber-200"><TextoEditable id="estado-pendiente" original="Pendiente" tag="span" /></Badge>
      case 'EN_TRANSITO':
        return <Badge className="bg-blue-100 text-blue-700 border border-blue-200"><TextoEditable id="estado-transito" original="En Tránsito" tag="span" /></Badge>
      case 'COMPLETADO':
        return <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200"><TextoEditable id="estado-completado" original="Completado" tag="span" /></Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'INTERNO':
        return <Badge variant="outline" className="border-stone-300 text-stone-600"><TextoEditable id="tipo-interno" original="Interno" tag="span" /></Badge>
      case 'ENTRADA':
        return <Badge variant="outline" className="border-emerald-300 text-emerald-600"><TextoEditable id="tipo-entrada" original="Entrada" tag="span" /></Badge>
      case 'SALIDA':
        return <Badge variant="outline" className="border-purple-300 text-purple-600"><TextoEditable id="tipo-salida" original="Salida" tag="span" /></Badge>
      default:
        return <Badge variant="outline">{tipo}</Badge>
    }
  }

  const movimientosFiltrados = movimientos.filter(m => {
    const matchEstado = filtroEstado === 'TODOS' || m.estado === filtroEstado
    const matchTipo = filtroTipo === 'TODOS' || m.tipoMovimiento === filtroTipo
    return matchEstado && matchTipo
  })

  const totalMovimientos = movimientos.length
  const pendientes = movimientos.filter(m => m.estado === 'PENDIENTE').length
  const enTransito = movimientos.filter(m => m.estado === 'EN_TRANSITO').length
  const completados = movimientos.filter(m => m.estado === 'COMPLETADO').length
  const pesoTotal = movimientos.reduce((acc, m) => acc + m.pesoKg, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <EditableBlock bloqueId="header" label="Encabezado">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
                <ArrowRightLeft className="w-8 h-8 text-amber-500" />
                <TextoEditable id="titulo-movimientos-despostada" original="Movimientos Despostada" tag="span" />
              </h1>
              <p className="text-stone-500 mt-1">
                <TextoEditable id="subtitulo-movimientos-despostada" original="Seguimiento de movimientos en área de despostada" tag="span" />
              </p>
            </div>
            <Button onClick={fetchMovimientos} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              <TextoEditable id="btn-actualizar-mov" original="Actualizar" tag="span" />
            </Button>
          </div>
        </EditableBlock>

        {/* Resumen */}
        <EditableBlock bloqueId="resumen" label="Tarjetas de Resumen">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setFiltroEstado('TODOS'); setFiltroTipo('TODOS') }}>
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-total-mov" original="Total" tag="span" /></p>
                <p className="text-3xl font-bold text-stone-800">{totalMovimientos}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltroEstado('PENDIENTE')}>
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-pendientes-mov" original="Pendientes" tag="span" /></p>
                <p className="text-3xl font-bold text-amber-600">{pendientes}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltroEstado('EN_TRANSITO')}>
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-transito-mov" original="En Tránsito" tag="span" /></p>
                <p className="text-3xl font-bold text-blue-600">{enTransito}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltroEstado('COMPLETADO')}>
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-completados-mov" original="Completados" tag="span" /></p>
                <p className="text-3xl font-bold text-emerald-600">{completados}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-peso-total-mov" original="Peso Total" tag="span" /></p>
                <p className="text-3xl font-bold text-stone-800">{pesoTotal.toLocaleString('es-AR', { minimumFractionDigits: 1 })} kg</p>
              </CardContent>
            </Card>
          </div>
        </EditableBlock>

        {/* Formulario */}
        <EditableBlock bloqueId="formulario" label="Formulario Nuevo Movimiento">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                <TextoEditable id="titulo-form-mov" original="Nuevo Movimiento" tag="span" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <Label><TextoEditable id="label-producto-mov" original="Producto *" tag="span" /></Label>
                  <Select value={producto} onValueChange={setProducto}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCTOS_EJEMPLO.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label><TextoEditable id="label-origen-mov" original="Origen *" tag="span" /></Label>
                  <Select value={origen} onValueChange={setOrigen}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTACIONES.map(e => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label><TextoEditable id="label-destino-mov" original="Destino *" tag="span" /></Label>
                  <Select value={destino} onValueChange={setDestino}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTACIONES.map(e => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label><TextoEditable id="label-peso-mov" original="Peso (Kg) *" tag="span" /></Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={pesoKg}
                    onChange={(e) => setPesoKg(e.target.value)}
                    placeholder="0.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label><TextoEditable id="label-tipo-mov" original="Tipo" tag="span" /></Label>
                  <Select value={tipoMovimiento} onValueChange={(v) => setTipoMovimiento(v as 'INTERNO' | 'ENTRADA' | 'SALIDA')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INTERNO">Interno</SelectItem>
                      <SelectItem value="ENTRADA">Entrada</SelectItem>
                      <SelectItem value="SALIDA">Salida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleNuevoMovimiento} 
                    className="w-full bg-amber-500 hover:bg-amber-600"
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <ArrowRightLeft className="w-4 h-4 mr-2" />
                    )}
                    <TextoEditable id="btn-registrar-mov" original="Registrar" tag="span" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </EditableBlock>

        {/* Filtros */}
        <EditableBlock bloqueId="filtros" label="Filtros">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <Label><TextoEditable id="label-filtrar-estado" original="Filtrar por Estado" tag="span" /></Label>
                  <Select value={filtroEstado} onValueChange={(v) => setFiltroEstado(v as 'TODOS' | 'PENDIENTE' | 'EN_TRANSITO' | 'COMPLETADO')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos los estados</SelectItem>
                      <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                      <SelectItem value="EN_TRANSITO">En Tránsito</SelectItem>
                      <SelectItem value="COMPLETADO">Completado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-2">
                  <Label><TextoEditable id="label-filtrar-tipo" original="Filtrar por Tipo" tag="span" /></Label>
                  <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as 'TODOS' | 'INTERNO' | 'ENTRADA' | 'SALIDA')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos los tipos</SelectItem>
                      <SelectItem value="INTERNO">Interno</SelectItem>
                      <SelectItem value="ENTRADA">Entrada</SelectItem>
                      <SelectItem value="SALIDA">Salida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </EditableBlock>

        {/* Tabla */}
        <EditableBlock bloqueId="tabla" label="Tabla de Movimientos">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg">
              <CardTitle className="text-lg font-semibold">
                <TextoEditable id="titulo-tabla-mov" original="Movimientos" tag="span" />
                {filtroEstado !== 'TODOS' && ` - ${filtroEstado.replace('_', ' ')}`}
                {filtroTipo !== 'TODOS' && ` (${filtroTipo})`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
              ) : movimientosFiltrados.length === 0 ? (
                <div className="py-12 text-center text-stone-400">
                  <ArrowRightLeft className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p><TextoEditable id="msg-sin-movimientos" original="No hay movimientos con los filtros seleccionados" tag="span" /></p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead><TextoEditable id="th-fecha-mov" original="Fecha" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-producto-mov" original="Producto" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-origen-mov" original="Origen" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-destino-mov" original="Destino" tag="span" /></TableHead>
                      <TableHead className="text-right"><TextoEditable id="th-peso-mov" original="Peso" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-operador-mov" original="Operador" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-tipo-mov" original="Tipo" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-estado-mov" original="Estado" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-acciones-mov" original="Acciones" tag="span" /></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimientosFiltrados.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell>
                          {new Date(mov.fecha).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell className="font-medium">{mov.producto}</TableCell>
                        <TableCell>{mov.origen}</TableCell>
                        <TableCell>{mov.destino}</TableCell>
                        <TableCell className="text-right font-mono">{mov.pesoKg.toLocaleString('es-AR')} kg</TableCell>
                        <TableCell>{mov.operador}</TableCell>
                        <TableCell>{getTipoBadge(mov.tipoMovimiento)}</TableCell>
                        <TableCell>{getEstadoBadge(mov.estado)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {mov.estado === 'PENDIENTE' && (
                              <Button
                                size="sm"
                                className="bg-blue-500 hover:bg-blue-600"
                                onClick={() => handleCambiarEstado(mov.id, 'EN_TRANSITO')}
                              >
                                <Loader2 className="w-3 h-3 mr-1" />
                                <TextoEditable id="btn-iniciar-mov" original="Iniciar" tag="span" />
                              </Button>
                            )}
                            {mov.estado === 'EN_TRANSITO' && (
                              <Button
                                size="sm"
                                className="bg-emerald-500 hover:bg-emerald-600"
                                onClick={() => handleCambiarEstado(mov.id, 'COMPLETADO')}
                              >
                                <TextoEditable id="btn-completar-mov" original="Completar" tag="span" />
                              </Button>
                            )}
                            {mov.estado === 'COMPLETADO' && (
                              <span className="text-xs text-stone-400 py-2"><TextoEditable id="msg-finalizado-mov" original="Finalizado" tag="span" /></span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </EditableBlock>
      </div>
    </div>
  )
}

export default MovimientosDespostadaModule
