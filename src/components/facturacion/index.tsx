'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { 
  FileText, DollarSign, CheckCircle, XCircle, Eye, Plus, Trash2, Edit,
  RefreshCw, Loader2, Search, Truck, Package, User, Calculator,
  ClipboardList, AlertCircle
} from 'lucide-react'

interface Operador {
  id: string
  nombre: string
  rol: string
  permisos?: Record<string, boolean>
}

interface Props {
  operador: Operador
}

// Tipos
interface Cliente {
  id: string
  nombre: string
  cuit?: string
  matricula?: string
  razonSocial?: string
}

interface DespachoPendiente {
  id: string
  numero: number
  fecha: Date
  destino: string
  patenteCamion?: string
  chofer?: string
  remito?: string
  kgTotal: number
  cantidadMedias: number
  usuarios: Array<{
    usuarioId: string | null
    usuarioNombre: string
    kgTotal: number
  }>
}

interface ItemFactura {
  tipoProducto: string
  descripcion: string
  cantidad: number
  pesoKg: number
  precioUnitario: number
  subtotal: number
}

interface Factura {
  id: string
  numero: string
  fecha: Date
  cliente: {
    id: string
    nombre: string
    cuit?: string
  }
  subtotal: number
  iva: number
  total: number
  estado: string
  detalles: Array<{
    tipoProducto: string
    descripcion: string
    cantidad: number
    pesoKg?: number
    precioUnitario: number
    subtotal: number
  }>
}

const TIPOS_PRODUCTO = [
  { value: 'MEDIA_RES', label: 'Media Res Bovina', precioSugerido: 3500 },
  { value: 'CUARTO_DELANTERO', label: 'Cuarto Delantero', precioSugerido: 3200 },
  { value: 'CUARTO_TRASERO', label: 'Cuarto Trasero', precioSugerido: 3800 },
  { value: 'MENUDENCIA', label: 'Menudencias', precioSugerido: 1500 },
  { value: 'SERVICIO_DESPOSTE', label: 'Servicio Desposte', precioSugerido: 500 },
  { value: 'SERVICIO_FRIO', label: 'Servicio de Frío', precioSugerido: 200 },
  { value: 'CARNE_CORTE', label: 'Carne/Cortes', precioSugerido: 4500 },
  { value: 'OTRO', label: 'Otros', precioSugerido: 0 }
]

export function FacturacionModule({ operador }: Props) {
  const [activeTab, setActiveTab] = useState('despachos')
  
  // Estados generales
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Pestaña 1: Despachos pendientes
  const [despachosPendientes, setDespachosPendientes] = useState<DespachoPendiente[]>([])
  const [loadingDespachos, setLoadingDespachos] = useState(false)
  const [showFacturarDespacho, setShowFacturarDespacho] = useState(false)
  const [despachoSeleccionado, setDespachoSeleccionado] = useState<DespachoPendiente | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [itemsFactura, setItemsFactura] = useState<ItemFactura[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>('')
  const [observacionesFactura, setObservacionesFactura] = useState('')
  
  // Pestaña 2: Otros items
  const [showNuevaFacturaOtros, setShowNuevaFacturaOtros] = useState(false)
  const [itemsOtros, setItemsOtros] = useState<Array<{
    tipoProducto: string
    descripcion: string
    cantidad: number
    unidad: string
    pesoKg: number
    precioUnitario: number
  }>>([])
  const [clienteOtros, setClienteOtros] = useState<string>('')
  const [observacionesOtros, setObservacionesOtros] = useState('')
  
  // Pestaña 3: Histórico
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loadingFacturas, setLoadingFacturas] = useState(false)
  const [searchFactura, setSearchFactura] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('TODOS')
  const [showDetalleFactura, setShowDetalleFactura] = useState(false)
  const [facturaDetalle, setFacturaDetalle] = useState<Factura | null>(null)
  const [showAnularFactura, setShowAnularFactura] = useState(false)
  const [facturaAnular, setFacturaAnular] = useState<Factura | null>(null)
  const [showEditarFactura, setShowEditarFactura] = useState(false)
  const [facturaEditar, setFacturaEditar] = useState<Factura | null>(null)
  
  // Supervisor PIN
  const [showPinDialog, setShowPinDialog] = useState(false)
  const [pinIngresado, setPinIngresado] = useState('')
  const [accionPendiente, setAccionPendiente] = useState<'editar' | 'anular' | null>(null)

  // Cargar datos iniciales
  useEffect(() => {
    fetchClientes()
    if (activeTab === 'despachos') fetchDespachosPendientes()
    if (activeTab === 'historico') fetchFacturas()
  }, [activeTab])

  const fetchClientes = async () => {
    try {
      const res = await fetch('/api/facturacion?tipo=clientes')
      const data = await res.json()
      if (data.success) setClientes(data.data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchDespachosPendientes = async () => {
    setLoadingDespachos(true)
    try {
      const res = await fetch('/api/facturacion?tipo=despachos-pendientes')
      const data = await res.json()
      if (data.success) setDespachosPendientes(data.data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar despachos')
    } finally {
      setLoadingDespachos(false)
    }
  }

  const fetchFacturas = async () => {
    setLoadingFacturas(true)
    try {
      const params = new URLSearchParams()
      if (searchFactura) params.set('search', searchFactura)
      if (filtroEstado !== 'TODOS') params.set('estado', filtroEstado)
      
      const res = await fetch(`/api/facturacion?tipo=facturas&${params}`)
      const data = await res.json()
      if (data.success) setFacturas(data.data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar facturas')
    } finally {
      setLoadingFacturas(false)
    }
  }

  // Abrir dialog para facturar despacho
  const abrirFacturarDespacho = (despacho: DespachoPendiente) => {
    setDespachoSeleccionado(despacho)
    // Crear items por cada usuario del despacho
    const items: ItemFactura[] = despacho.usuarios.map(u => ({
      tipoProducto: 'MEDIA_RES',
      descripcion: `Medias reses - ${u.usuarioNombre}`,
      cantidad: 1,
      pesoKg: u.kgTotal,
      precioUnitario: 0,
      subtotal: 0
    }))
    setItemsFactura(items)
    setClienteSeleccionado(despacho.usuarios[0]?.usuarioId || '')
    setObservacionesFactura('')
    setShowFacturarDespacho(true)
  }

  // Actualizar item de factura
  const updateItemFactura = (index: number, field: string, value: number) => {
    setItemsFactura(prev => {
      const newItems = [...prev]
      newItems[index] = { ...newItems[index], [field]: value }
      newItems[index].subtotal = newItems[index].pesoKg * newItems[index].precioUnitario
      return newItems
    })
  }

  // Calcular totales
  const calcularTotales = (items: ItemFactura[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
    const iva = subtotal * 0.21
    const total = subtotal + iva
    return { subtotal, iva, total }
  }

  // Crear factura desde despacho
  const handleCrearFacturaDespacho = async () => {
    if (!clienteSeleccionado) {
      toast.error('Debe seleccionar un cliente')
      return
    }

    if (itemsFactura.some(item => item.precioUnitario <= 0)) {
      toast.error('Todos los items deben tener un precio')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/facturacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'crear-desde-despacho',
          despachoId: despachoSeleccionado?.id,
          clienteId: clienteSeleccionado,
          detalles: itemsFactura,
          observaciones: observacionesFactura,
          operadorId: operador.id
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setShowFacturarDespacho(false)
        fetchDespachosPendientes()
      } else {
        toast.error(data.error || 'Error al crear factura')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  // Agregar item a factura de otros
  const addItemOtros = () => {
    setItemsOtros(prev => [...prev, {
      tipoProducto: 'OTRO',
      descripcion: '',
      cantidad: 1,
      unidad: 'KG',
      pesoKg: 0,
      precioUnitario: 0
    }])
  }

  const removeItemOtros = (index: number) => {
    setItemsOtros(prev => prev.filter((_, i) => i !== index))
  }

  const updateItemOtros = (index: number, field: string, value: string | number) => {
    setItemsOtros(prev => {
      const newItems = [...prev]
      newItems[index] = { ...newItems[index], [field]: value }
      return newItems
    })
  }

  // Crear factura de otros items
  const handleCrearFacturaOtros = async () => {
    if (!clienteOtros) {
      toast.error('Debe seleccionar un cliente')
      return
    }

    if (itemsOtros.length === 0) {
      toast.error('Debe agregar al menos un item')
      return
    }

    if (itemsOtros.some(item => !item.descripcion || item.precioUnitario <= 0)) {
      toast.error('Todos los items deben tener descripción y precio')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/facturacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'crear-otros-items',
          clienteId: clienteOtros,
          items: itemsOtros,
          observaciones: observacionesOtros,
          operadorId: operador.id
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setShowNuevaFacturaOtros(false)
        setItemsOtros([])
        setClienteOtros('')
        setObservacionesOtros('')
        setActiveTab('historico')
      } else {
        toast.error(data.error || 'Error al crear factura')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  // Ver detalle de factura
  const verDetalleFactura = async (factura: Factura) => {
    setFacturaDetalle(factura)
    setShowDetalleFactura(true)
  }

  // Solicitar acción protegida (editar/anular)
  const solicitarAccionProtegida = (accion: 'editar' | 'anular', factura: Factura) => {
    setAccionPendiente(accion)
    setFacturaAnular(factura)
    setFacturaEditar(factura)
    setShowPinDialog(true)
    setPinIngresado('')
  }

  // Verificar PIN de supervisor
  const verificarPin = async () => {
    try {
      const res = await fetch('/api/auth/supervisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinIngresado })
      })
      const data = await res.json()
      
      if (data.success) {
        setShowPinDialog(false)
        if (accionPendiente === 'anular') {
          setShowAnularFactura(true)
        } else if (accionPendiente === 'editar') {
          setShowEditarFactura(true)
        }
      } else {
        toast.error('PIN incorrecto')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al verificar PIN')
    }
  }

  // Anular factura
  const handleAnularFactura = async () => {
    if (!facturaAnular) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/facturacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'anular',
          facturaId: facturaAnular.id
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setShowAnularFactura(false)
        setFacturaAnular(null)
        fetchFacturas()
      } else {
        toast.error(data.error || 'Error al anular')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
              <FileText className="w-8 h-8 text-amber-500" />
              Facturación
            </h1>
            <p className="text-stone-500 mt-1">
              Gestión de facturas - {operador.nombre}
            </p>
          </div>
          <Button onClick={() => setActiveTab('despachos')} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="despachos" className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Facturar Despachos
            </TabsTrigger>
            <TabsTrigger value="otros" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Otros Items
            </TabsTrigger>
            <TabsTrigger value="historico" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Despachos pendientes */}
          <TabsContent value="despachos" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Despachos Pendientes de Facturar</h3>
              <Button onClick={fetchDespachosPendientes} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
            </div>

            {loadingDespachos ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : despachosPendientes.length === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-300" />
                  <p className="text-lg text-stone-600">No hay despachos pendientes de facturar</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Despacho</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Usuario/s</TableHead>
                      <TableHead className="text-right">KG</TableHead>
                      <TableHead>Remito</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {despachosPendientes.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-bold">#{d.numero}</TableCell>
                        <TableCell>{new Date(d.fecha).toLocaleDateString('es-AR')}</TableCell>
                        <TableCell>{d.destino}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {d.usuarios.map((u, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {u.usuarioNombre}: {u.kgTotal.toFixed(0)}kg
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">{d.kgTotal.toFixed(1)}</TableCell>
                        <TableCell>{d.remito || '-'}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            onClick={() => abrirFacturarDespacho(d)}
                            className="bg-emerald-500 hover:bg-emerald-600"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Facturar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          {/* Tab 2: Otros Items */}
          <TabsContent value="otros" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Facturación de Otros Items</h3>
              <Button onClick={() => setShowNuevaFacturaOtros(true)} className="bg-emerald-500 hover:bg-emerald-600">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Factura
              </Button>
            </div>

            <Card className="border-0 shadow-md">
              <CardContent className="py-8">
                <div className="text-center text-stone-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-stone-300" />
                  <p>Facturación de servicios y productos no relacionados a despachos</p>
                  <p className="text-sm mt-2">Incluye: Servicio desposte, menudencias, cortes, servicio de frío, otros</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Histórico */}
          <TabsContent value="historico" className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  placeholder="Buscar por número o cliente..."
                  value={searchFactura}
                  onChange={(e) => setSearchFactura(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="PENDIENTE">Pendientes</SelectItem>
                  <SelectItem value="EMITIDA">Emitidas</SelectItem>
                  <SelectItem value="PAGADA">Pagadas</SelectItem>
                  <SelectItem value="ANULADA">Anuladas</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={fetchFacturas} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Buscar
              </Button>
            </div>

            {loadingFacturas ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : facturas.length === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="py-12 text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-stone-300" />
                  <p className="text-lg text-stone-600">No hay facturas</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="text-right">IVA</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturas.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-mono font-bold">{f.numero}</TableCell>
                        <TableCell>{new Date(f.fecha).toLocaleDateString('es-AR')}</TableCell>
                        <TableCell>{f.cliente.nombre}</TableCell>
                        <TableCell className="text-right">${f.subtotal.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${f.iva.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-bold">${f.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={
                            f.estado === 'PAGADA' ? 'bg-emerald-100 text-emerald-700' :
                            f.estado === 'EMITIDA' ? 'bg-blue-100 text-blue-700' :
                            f.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }>
                            {f.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => verDetalleFactura(f)}
                              title="Ver detalle"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {f.estado !== 'ANULADA' && (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-blue-500 hover:text-blue-700"
                                  onClick={() => solicitarAccionProtegida('editar', f)}
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => solicitarAccionProtegida('anular', f)}
                                  title="Anular"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog Facturar Despacho */}
      <Dialog open={showFacturarDespacho} onOpenChange={setShowFacturarDespacho}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              Facturar Despacho #{despachoSeleccionado?.numero}
            </DialogTitle>
            <DialogDescription>
              Destino: {despachoSeleccionado?.destino} | {despachoSeleccionado?.kgTotal.toFixed(1)} kg totales
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Cliente *</Label>
              <Select value={clienteSeleccionado} onValueChange={setClienteSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre} {c.cuit ? `- CUIT: ${c.cuit}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Items a facturar</Label>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">KG</TableHead>
                    <TableHead className="text-right">Precio/KG</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsFactura.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.descripcion}</TableCell>
                      <TableCell className="text-right">{item.pesoKg.toFixed(1)}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={item.precioUnitario || ''}
                          onChange={(e) => updateItemFactura(idx, 'precioUnitario', parseFloat(e.target.value) || 0)}
                          className="w-28 text-right"
                          placeholder="0.00"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${item.subtotal.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="bg-stone-50 rounded-lg p-4">
              {(() => {
                const { subtotal, iva, total } = calcularTotales(itemsFactura)
                return (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IVA (21%):</span>
                      <span>${iva.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                )
              })()}
            </div>

            <div>
              <Label>Observaciones</Label>
              <Input
                value={observacionesFactura}
                onChange={(e) => setObservacionesFactura(e.target.value)}
                placeholder="Observaciones de la factura"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFacturarDespacho(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCrearFacturaDespacho}
              disabled={saving || !clienteSeleccionado}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
              Crear Factura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Nueva Factura Otros Items */}
      <Dialog open={showNuevaFacturaOtros} onOpenChange={setShowNuevaFacturaOtros}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-500" />
              Nueva Factura - Otros Items
            </DialogTitle>
            <DialogDescription>
              Facturación de servicios desposte, menudencias, cortes, frío, otros
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Cliente *</Label>
              <Select value={clienteOtros} onValueChange={setClienteOtros}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre} {c.cuit ? `- CUIT: ${c.cuit}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Items</Label>
                <Button size="sm" variant="outline" onClick={addItemOtros}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Item
                </Button>
              </div>
              
              {itemsOtros.length === 0 ? (
                <div className="text-center py-8 text-stone-400 border rounded-lg">
                  <Package className="w-8 h-8 mx-auto mb-2" />
                  <p>No hay items agregados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {itemsOtros.map((item, idx) => {
                    const subtotalItem = (item.unidad === 'KG' ? item.pesoKg : item.cantidad) * item.precioUnitario
                    return (
                      <Card key={idx} className="p-3">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                          <div>
                            <Label className="text-xs">Tipo</Label>
                            <Select 
                              value={item.tipoProducto} 
                              onValueChange={(v) => {
                                const tipo = TIPOS_PRODUCTO.find(t => t.value === v)
                                updateItemOtros(idx, 'tipoProducto', v)
                                if (tipo?.precioSugerido) {
                                  updateItemOtros(idx, 'precioUnitario', tipo.precioSugerido)
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TIPOS_PRODUCTO.map((t) => (
                                  <SelectItem key={t.value} value={t.value}>
                                    {t.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-xs">Descripción *</Label>
                            <Input
                              value={item.descripcion}
                              onChange={(e) => updateItemOtros(idx, 'descripcion', e.target.value)}
                              placeholder="Descripción del item"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">KG/Cantidad</Label>
                            <Input
                              type="number"
                              value={item.unidad === 'KG' ? item.pesoKg || '' : item.cantidad || ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0
                                if (item.unidad === 'KG') {
                                  updateItemOtros(idx, 'pesoKg', val)
                                } else {
                                  updateItemOtros(idx, 'cantidad', val)
                                }
                              }}
                            />
                          </div>
                          <div className="flex gap-2 items-end">
                            <div className="flex-1">
                              <Label className="text-xs">Precio</Label>
                              <Input
                                type="number"
                                value={item.precioUnitario || ''}
                                onChange={(e) => updateItemOtros(idx, 'precioUnitario', parseFloat(e.target.value) || 0)}
                              />
                            </div>
                            <div className="text-right min-w-[60px]">
                              <p className="text-xs text-stone-500">Subtotal</p>
                              <p className="font-medium">${subtotalItem.toFixed(2)}</p>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-500"
                              onClick={() => removeItemOtros(idx)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            {itemsOtros.length > 0 && (
              <div className="bg-stone-50 rounded-lg p-4">
                {(() => {
                  const subtotal = itemsOtros.reduce((sum, item) => 
                    sum + (item.unidad === 'KG' ? item.pesoKg : item.cantidad) * item.precioUnitario, 0)
                  const iva = subtotal * 0.21
                  const total = subtotal + iva
                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>IVA (21%):</span>
                        <span>${iva.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            <div>
              <Label>Observaciones</Label>
              <Input
                value={observacionesOtros}
                onChange={(e) => setObservacionesOtros(e.target.value)}
                placeholder="Observaciones de la factura"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNuevaFacturaOtros(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCrearFacturaOtros}
              disabled={saving || !clienteOtros || itemsOtros.length === 0}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
              Crear Factura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalle Factura */}
      <Dialog open={showDetalleFactura} onOpenChange={setShowDetalleFactura}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              Factura #{facturaDetalle?.numero}
            </DialogTitle>
            <DialogDescription>
              Cliente: {facturaDetalle?.cliente.nombre}
            </DialogDescription>
          </DialogHeader>

          {facturaDetalle && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-stone-500">Fecha</p>
                  <p className="font-medium">{new Date(facturaDetalle.fecha).toLocaleDateString('es-AR')}</p>
                </div>
                <div>
                  <p className="text-stone-500">Estado</p>
                  <Badge className={
                    facturaDetalle.estado === 'PAGADA' ? 'bg-emerald-100 text-emerald-700' :
                    facturaDetalle.estado === 'EMITIDA' ? 'bg-blue-100 text-blue-700' :
                    facturaDetalle.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }>
                    {facturaDetalle.estado}
                  </Badge>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">KG/Cant</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facturaDetalle.detalles.map((d, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{d.descripcion}</TableCell>
                      <TableCell className="text-right">{d.pesoKg?.toFixed(1) || d.cantidad}</TableCell>
                      <TableCell className="text-right">${d.precioUnitario.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${d.subtotal.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="bg-stone-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${facturaDetalle.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA (21%):</span>
                    <span>${facturaDetalle.iva.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>${facturaDetalle.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetalleFactura(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog PIN Supervisor */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-5 h-5" />
              Autorización Requerida
            </DialogTitle>
            <DialogDescription>
              Ingrese el PIN de supervisor para {accionPendiente === 'anular' ? 'anular' : 'editar'} la factura
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Input
              type="password"
              value={pinIngresado}
              onChange={(e) => setPinIngresado(e.target.value)}
              placeholder="PIN de supervisor"
              className="text-center text-2xl tracking-widest"
              maxLength={6}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPinDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={verificarPin}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Anular Factura */}
      <AlertDialog open={showAnularFactura} onOpenChange={setShowAnularFactura}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              Anular Factura #{facturaAnular?.numero}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La factura será marcada como anulada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAnularFactura}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700"
            >
              {saving ? 'Anulando...' : 'Anular Factura'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default FacturacionModule
