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
  Package, Loader2, RefreshCw, Plus, CheckCircle
} from 'lucide-react'
import { TextoEditable, EditableBlock, useEditor } from '@/components/ui/editable-screen'

interface Operador {
  id: string
  nombre: string
  rol: string
  permisos?: Record<string, boolean>
}

interface Empaque {
  id: string
  fecha: string
  paqueteId: string
  producto: string
  pesoKg: number
  cantidad: number
  destino: string
  estado: 'PENDIENTE' | 'EMPACADO' | 'DESPACHADO'
  operador: string
}

interface Props {
  operador: Operador
}

const PRODUCTOS = [
  'Carne Molida', 'Bola de Lomo', 'Nalga', 'Cuadril', 'Colita de Cuadril',
  'Bife de Chorizo', 'Bife Angosto', 'Osobuco', 'Costilla', 'Falda',
  'Vacío', 'Matambre', 'Asado', 'Hígado', 'Riñón', 'Corazón'
]

const DESTINOS = [
  'Cámara Frigorífica 1', 'Cámara Frigorífica 2', 'Expedición Local', 'Exportación',
  'Cadena de Supermercados A', 'Cadena de Supermercados B', 'Distribuidora Regional'
]

export function EmpaqueModule({ operador }: Props) {
  const { editMode, getTexto, setTexto, getBloque, updateBloque } = useEditor()
  const [empaques, setEmpaques] = useState<Empaque[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'TODOS' | 'PENDIENTE' | 'EMPACADO' | 'DESPACHADO'>('TODOS')
  
  const [producto, setProducto] = useState('')
  const [pesoKg, setPesoKg] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [destino, setDestino] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchEmpaques()
  }, [])

  const fetchEmpaques = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setEmpaques([
        { id: '1', fecha: new Date().toISOString(), paqueteId: 'EMP-2024-0001', producto: 'Bola de Lomo', pesoKg: 25.5, cantidad: 10, destino: 'Cámara Frigorífica 1', estado: 'EMPACADO', operador: 'Juan Pérez' },
        { id: '2', fecha: new Date().toISOString(), paqueteId: 'EMP-2024-0002', producto: 'Carne Molida', pesoKg: 15.0, cantidad: 20, destino: 'Cadena de Supermercados A', estado: 'PENDIENTE', operador: 'María García' },
        { id: '3', fecha: new Date(Date.now() - 3600000).toISOString(), paqueteId: 'EMP-2024-0003', producto: 'Bife de Chorizo', pesoKg: 35.0, cantidad: 15, destino: 'Exportación', estado: 'DESPACHADO', operador: 'Carlos López' },
        { id: '4', fecha: new Date(Date.now() - 7200000).toISOString(), paqueteId: 'EMP-2024-0004', producto: 'Nalga', pesoKg: 42.0, cantidad: 8, destino: 'Cámara Frigorífica 2', estado: 'PENDIENTE', operador: 'Ana Martínez' },
        { id: '5', fecha: new Date(Date.now() - 10800000).toISOString(), paqueteId: 'EMP-2024-0005', producto: 'Vacío', pesoKg: 18.5, cantidad: 12, destino: 'Expedición Local', estado: 'EMPACADO', operador: 'Pedro Sánchez' },
        { id: '6', fecha: new Date(Date.now() - 14400000).toISOString(), paqueteId: 'EMP-2024-0006', producto: 'Costilla', pesoKg: 28.0, cantidad: 6, destino: 'Distribuidora Regional', estado: 'PENDIENTE', operador: 'Laura Torres' }
      ])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar empaques')
    } finally {
      setLoading(false)
    }
  }

  const handleEmpacar = async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      setEmpaques(empaques.map(e => e.id === id ? { ...e, estado: 'EMPACADO' } : e))
      toast.success('Paquete marcado como empacado')
    } catch (error) {
      toast.error('Error al actualizar estado')
    }
  }

  const handleNuevoEmpaque = async () => {
    if (!producto || !pesoKg || !cantidad || !destino) {
      toast.error('Complete todos los campos obligatorios')
      return
    }
    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      const nextId = empaques.length + 1
      const nuevoEmpaque: Empaque = {
        id: Date.now().toString(),
        fecha: new Date().toISOString(),
        paqueteId: `EMP-2024-${String(nextId).padStart(4, '0')}`,
        producto,
        pesoKg: parseFloat(pesoKg),
        cantidad: parseInt(cantidad),
        destino,
        estado: 'PENDIENTE',
        operador: operador.nombre
      }
      setEmpaques([nuevoEmpaque, ...empaques])
      setProducto('')
      setPesoKg('')
      setCantidad('')
      setDestino('')
      toast.success('Paquete creado correctamente')
    } catch (error) {
      toast.error('Error al crear paquete')
    } finally {
      setSaving(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Badge className="bg-amber-100 text-amber-700"><TextoEditable id="estado-pendiente" original="Pendiente" tag="span" /></Badge>
      case 'EMPACADO':
        return <Badge className="bg-emerald-100 text-emerald-700"><TextoEditable id="estado-empacado" original="Empacado" tag="span" /></Badge>
      case 'DESPACHADO':
        return <Badge className="bg-blue-100 text-blue-700"><TextoEditable id="estado-despachado" original="Despachado" tag="span" /></Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const empaquesFiltrados = empaques.filter(e => filtro === 'TODOS' || e.estado === filtro)
  const pendientes = empaques.filter(e => e.estado === 'PENDIENTE').length
  const empacados = empaques.filter(e => e.estado === 'EMPACADO').length
  const pesoTotal = empaques.reduce((acc, e) => acc + (e.pesoKg * e.cantidad), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <EditableBlock bloqueId="header" label="Encabezado">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
                <Package className="w-8 h-8 text-amber-500" />
                <TextoEditable id="empaque-titulo" original="Empaque de Productos" tag="span" />
              </h1>
              <p className="text-stone-500 mt-1">
                <TextoEditable id="empaque-subtitulo" original="Control de empaquetado de productos cárnicos" tag="span" />
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-stone-500">
                <TextoEditable id="label-operador" original="Operador" tag="span" />: <span className="font-medium text-stone-700">{operador.nombre}</span>
              </span>
              <Button onClick={fetchEmpaques} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                <TextoEditable id="btn-actualizar" original="Actualizar" tag="span" />
              </Button>
            </div>
          </div>
        </EditableBlock>

        {/* Resumen */}
        <EditableBlock bloqueId="resumenCards" label="Tarjetas de Resumen">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow bg-white" onClick={() => setFiltro('TODOS')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-total-paquetes" original="Total Paquetes" tag="span" /></p>
                    <p className="text-3xl font-bold text-stone-800 mt-1">{empaques.length}</p>
                  </div>
                  <Package className="w-8 h-8 text-stone-300" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow bg-white" onClick={() => setFiltro('PENDIENTE')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-pendientes" original="Pendientes" tag="span" /></p>
                    <p className="text-3xl font-bold text-amber-600 mt-1">{pendientes}</p>
                  </div>
                  <Package className="w-8 h-8 text-amber-300" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow bg-white" onClick={() => setFiltro('EMPACADO')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-empacados" original="Empacados" tag="span" /></p>
                    <p className="text-3xl font-bold text-emerald-600 mt-1">{empacados}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-emerald-300" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-peso-total" original="Peso Total" tag="span" /></p>
                    <p className="text-3xl font-bold text-stone-800 mt-1">{pesoTotal.toLocaleString('es-AR', { maximumFractionDigits: 1 })} kg</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-stone-500">KG</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </EditableBlock>

        {/* Formulario */}
        <EditableBlock bloqueId="formulario" label="Formulario">
          <Card className="border-0 shadow-md bg-white">
            <CardHeader className="bg-stone-50 rounded-t-lg border-b border-stone-100">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-stone-800">
                <Plus className="w-5 h-5 text-amber-500" />
                <TextoEditable id="titulo-nuevo-paquete" original="Nuevo Paquete" tag="span" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label className="text-stone-600"><TextoEditable id="label-producto" original="Producto" tag="span" /> *</Label>
                  <Select value={producto} onValueChange={setProducto}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Seleccionar producto" /></SelectTrigger>
                    <SelectContent>
                      {PRODUCTOS.map(p => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-stone-600"><TextoEditable id="label-peso-unidad" original="Peso por Unidad (Kg)" tag="span" /> *</Label>
                  <Input type="number" step="0.1" value={pesoKg} onChange={(e) => setPesoKg(e.target.value)} placeholder="0.0" className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-stone-600"><TextoEditable id="label-cantidad" original="Cantidad" tag="span" /> *</Label>
                  <Input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="0" className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-stone-600"><TextoEditable id="label-destino" original="Destino" tag="span" /> *</Label>
                  <Select value={destino} onValueChange={setDestino}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Seleccionar destino" /></SelectTrigger>
                    <SelectContent>
                      {DESTINOS.map(d => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleNuevoEmpaque} className="w-full bg-amber-500 hover:bg-amber-600 text-white" disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Package className="w-4 h-4 mr-2" />}
                    <TextoEditable id="btn-crear-paquete" original="Crear Paquete" tag="span" />
                  </Button>
                </div>
              </div>
              {producto && pesoKg && cantidad && (
                <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-sm text-amber-700">
                    <span className="font-medium"><TextoEditable id="label-resumen" original="Resumen" tag="span" />:</span> {cantidad} <TextoEditable id="label-unidades" original="unidades" tag="span" /> × {pesoKg} kg = 
                    <span className="font-bold"> {(parseFloat(pesoKg) * parseInt(cantidad || '0')).toLocaleString('es-AR', { maximumFractionDigits: 1 })} kg <TextoEditable id="label-totales" original="totales" tag="span" /></span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </EditableBlock>

        {/* Tabla */}
        <EditableBlock bloqueId="tablaEmpaques" label="Tabla de Paquetes">
          <Card className="border-0 shadow-md bg-white">
            <CardHeader className="bg-stone-50 rounded-t-lg border-b border-stone-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-stone-800">
                  <TextoEditable id="titulo-paquetes" original="Paquetes" tag="span" /> {filtro !== 'TODOS' ? `- ${filtro.charAt(0) + filtro.slice(1).toLowerCase()}` : ''}
                </CardTitle>
                <div className="flex gap-2">
                  {(['TODOS', 'PENDIENTE', 'EMPACADO'] as const).map((f) => (
                    <Button key={f} variant={filtro === f ? 'default' : 'outline'} size="sm" onClick={() => setFiltro(f)}
                      className={filtro === f ? 'bg-amber-500 hover:bg-amber-600' : ''}>
                      {f === 'TODOS' ? <TextoEditable id={`filtro-${f.toLowerCase()}`} original="Todos" tag="span" /> : 
                       f === 'PENDIENTE' ? <TextoEditable id={`filtro-${f.toLowerCase()}`} original="Pendientes" tag="span" /> :
                       <TextoEditable id={`filtro-${f.toLowerCase()}`} original="Empacados" tag="span" />}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
              ) : empaquesFiltrados.length === 0 ? (
                <div className="py-12 text-center text-stone-400">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg"><TextoEditable id="msg-no-hay-paquetes" original="No hay paquetes" tag="span" /> {filtro.toLowerCase()}</p>
                  <p className="text-sm mt-1"><TextoEditable id="msg-cree-paquete" original="Cree un nuevo paquete usando el formulario superior" tag="span" /></p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-stone-50/50 hover:bg-stone-50/50">
                        <TableHead className="font-semibold text-stone-600"><TextoEditable id="th-fecha" original="Fecha" tag="span" /></TableHead>
                        <TableHead className="font-semibold text-stone-600"><TextoEditable id="th-id-paquete" original="ID Paquete" tag="span" /></TableHead>
                        <TableHead className="font-semibold text-stone-600"><TextoEditable id="th-producto" original="Producto" tag="span" /></TableHead>
                        <TableHead className="font-semibold text-stone-600"><TextoEditable id="th-peso" original="Peso" tag="span" /></TableHead>
                        <TableHead className="font-semibold text-stone-600"><TextoEditable id="th-cantidad" original="Cantidad" tag="span" /></TableHead>
                        <TableHead className="font-semibold text-stone-600"><TextoEditable id="th-destino" original="Destino" tag="span" /></TableHead>
                        <TableHead className="font-semibold text-stone-600"><TextoEditable id="th-estado" original="Estado" tag="span" /></TableHead>
                        <TableHead className="font-semibold text-stone-600"><TextoEditable id="th-operador" original="Operador" tag="span" /></TableHead>
                        <TableHead className="font-semibold text-stone-600 text-center"><TextoEditable id="th-acciones" original="Acciones" tag="span" /></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {empaquesFiltrados.map((emp) => (
                        <TableRow key={emp.id} className="hover:bg-stone-50/50">
                          <TableCell className="text-stone-600">{new Date(emp.fecha).toLocaleDateString('es-AR')}</TableCell>
                          <TableCell className="font-mono font-medium text-stone-800">{emp.paqueteId}</TableCell>
                          <TableCell className="font-medium text-stone-800">{emp.producto}</TableCell>
                          <TableCell className="text-stone-600">{emp.pesoKg.toLocaleString('es-AR')} kg</TableCell>
                          <TableCell className="text-stone-600">{emp.cantidad} <TextoEditable id="label-uds" original="uds" tag="span" /></TableCell>
                          <TableCell className="text-stone-600 max-w-[150px] truncate">{emp.destino}</TableCell>
                          <TableCell>{getEstadoBadge(emp.estado)}</TableCell>
                          <TableCell className="text-stone-600">{emp.operador}</TableCell>
                          <TableCell className="text-center">
                            {emp.estado === 'PENDIENTE' && (
                              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => handleEmpacar(emp.id)}>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                <TextoEditable id="btn-empacar" original="Empacar" tag="span" />
                              </Button>
                            )}
                            {emp.estado === 'EMPACADO' && (
                              <span className="text-sm text-emerald-600 flex items-center justify-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                <TextoEditable id="msg-listo" original="Listo" tag="span" />
                              </span>
                            )}
                            {emp.estado === 'DESPACHADO' && (
                              <span className="text-sm text-blue-600"><TextoEditable id="msg-en-transito" original="En tránsito" tag="span" /></span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </EditableBlock>
      </div>
    </div>
  )
}

export default EmpaqueModule
