'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, DollarSign, CheckCircle, XCircle, Eye, 
  Plus, Search, Loader2, Printer, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { TextoEditable, EditableBlock, useEditor } from '@/components/ui/editable-screen'

interface Operador { id: string; nombre: string; rol: string }

interface Factura {
  id: string; numero: string; fecha: string; cliente: string
  tipoComprobante: 'FACTURA_A' | 'FACTURA_B' | 'FACTURA_C' | 'REMITO'
  monto: number; estado: 'PENDIENTE' | 'PAGADA' | 'ANULADA'
}

interface Props { operador: Operador }

const TIPOS_COMPROBANTE = [
  { value: 'FACTURA_A', label: 'Factura A' }, { value: 'FACTURA_B', label: 'Factura B' },
  { value: 'FACTURA_C', label: 'Factura C' }, { value: 'REMITO', label: 'Remito' },
]

const CLIENTES_SIMULADOS = [
  { id: '1', nombre: 'Carnicería Don José' }, { id: '2', nombre: 'Supermercados del Valle' },
  { id: '3', nombre: 'Frigorífico Regional' }, { id: '4', nombre: 'Distribuidora Norte' },
  { id: '5', nombre: 'Market Central' },
]

export function FacturacionModule({ operador }: Props) {
  const { editMode, getTexto } = useEditor()
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'PENDIENTE' | 'PAGADA' | 'ANULADA'>('TODOS')
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    cliente: '', tipoComprobante: 'FACTURA_B' as const,
    numero: '', fecha: new Date().toISOString().split('T')[0], monto: 0,
  })

  const facturasSimuladas: Factura[] = [
    { id: '1', numero: '0001-00001234', fecha: '2025-01-15', cliente: 'Carnicería Don José', tipoComprobante: 'FACTURA_B', monto: 458750.00, estado: 'PAGADA' },
    { id: '2', numero: '0001-00001235', fecha: '2025-01-16', cliente: 'Supermercados del Valle', tipoComprobante: 'FACTURA_A', monto: 892300.50, estado: 'PENDIENTE' },
    { id: '3', numero: '0001-00001236', fecha: '2025-01-17', cliente: 'Frigorífico Regional', tipoComprobante: 'FACTURA_B', monto: 1250000.00, estado: 'PENDIENTE' },
    { id: '4', numero: 'R-0001-00567', fecha: '2025-01-14', cliente: 'Distribuidora Norte', tipoComprobante: 'REMITO', monto: 320000.00, estado: 'PAGADA' },
    { id: '5', numero: '0001-00001230', fecha: '2025-01-10', cliente: 'Market Central', tipoComprobante: 'FACTURA_C', monto: 185000.00, estado: 'ANULADA' },
    { id: '6', numero: '0001-00001237', fecha: '2025-01-18', cliente: 'Carnicería Don José', tipoComprobante: 'FACTURA_B', monto: 567800.00, estado: 'PENDIENTE' },
  ]

  useEffect(() => { fetchFacturas() }, [])

  const fetchFacturas = async () => {
    setLoading(true)
    try { await new Promise(resolve => setTimeout(resolve, 500)); setFacturas(facturasSimuladas) }
    catch { toast.error('Error al cargar las facturas') }
    finally { setLoading(false) }
  }

  const handleNuevaFactura = () => {
    setFormData({ cliente: '', tipoComprobante: 'FACTURA_B', numero: `0001-${String(facturas.length + 1).padStart(8, '0')}`, fecha: new Date().toISOString().split('T')[0], monto: 0 })
    setDialogOpen(true)
  }

  const handleGuardar = async () => {
    if (!formData.cliente) { toast.error('Debe seleccionar un cliente'); return }
    if (!formData.numero) { toast.error('Debe ingresar un número de comprobante'); return }
    if (formData.monto <= 0) { toast.error('El monto debe ser mayor a cero'); return }
    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      const nuevaFactura: Factura = { id: String(facturas.length + 1), ...formData, estado: 'PENDIENTE' }
      setFacturas([nuevaFactura, ...facturas])
      toast.success(`Factura ${formData.numero} creada exitosamente`)
      setDialogOpen(false)
    } catch { toast.error('Error al guardar la factura') }
    finally { setSaving(false) }
  }

  const handleMarcarPagada = async (factura: Factura) => {
    try { await new Promise(resolve => setTimeout(resolve, 300)); setFacturas(facturas.map(f => f.id === factura.id ? { ...f, estado: 'PAGADA' as const } : f)); toast.success(`Factura ${factura.numero} marcada como pagada`) }
    catch { toast.error('Error al actualizar el estado') }
  }

  const handleAnular = (factura: Factura) => { setFacturaSeleccionada(factura); setDeleteOpen(true) }

  const handleConfirmarAnular = async () => {
    if (!facturaSeleccionada) return
    setSaving(true)
    try { await new Promise(resolve => setTimeout(resolve, 300)); setFacturas(facturas.map(f => f.id === facturaSeleccionada.id ? { ...f, estado: 'ANULADA' as const } : f)); toast.success(`Factura ${facturaSeleccionada.numero} anulada`); setDeleteOpen(false) }
    catch { toast.error('Error al anular la factura') }
    finally { setSaving(false) }
  }

  const handleImprimir = (factura: Factura) => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`<!DOCTYPE html><html><head><title>Comprobante ${factura.numero}</title><style>body{font-family:Arial;padding:40px;max-width:800px;margin:0 auto}.header{text-align:center;border-bottom:2px solid #333;padding-bottom:20px;margin-bottom:30px}.title{font-size:24px;font-weight:bold}.row{display:flex;margin-bottom:8px}.label{font-weight:bold;width:200px;color:#555}.value{flex:1}.total{font-size:20px;font-weight:bold;margin-top:20px;text-align:right}</style></head><body><div class="header"><div class="title">${TIPOS_COMPROBANTE.find(t => t.value === factura.tipoComprobante)?.label}</div><div>N° ${factura.numero}</div></div><div class="row"><span class="label">Fecha:</span><span class="value">${new Date(factura.fecha).toLocaleDateString('es-AR')}</span></div><div class="row"><span class="label">Cliente:</span><span class="value">${factura.cliente}</span></div><div class="total">Total: $${factura.monto.toLocaleString('es-AR', {minimumFractionDigits:2})}</div></body></html>`)
      printWindow.document.close(); printWindow.print()
    }
    toast.success('Enviando a impresión...')
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return <Badge className="bg-amber-100 text-amber-700"><TextoEditable id="estado-pendiente-fact" original="Pendiente" tag="span" /></Badge>
      case 'PAGADA': return <Badge className="bg-emerald-100 text-emerald-700"><TextoEditable id="estado-pagada-fact" original="Pagada" tag="span" /></Badge>
      case 'ANULADA': return <Badge className="bg-red-100 text-red-700"><TextoEditable id="estado-anulada-fact" original="Anulada" tag="span" /></Badge>
      default: return <Badge>{estado}</Badge>
    }
  }

  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(amount)

  const facturasFiltradas = facturas.filter(f => {
    const matchEstado = filtroEstado === 'TODOS' || f.estado === filtroEstado
    const matchSearch = !searchTerm || f.numero.toLowerCase().includes(searchTerm.toLowerCase()) || f.cliente.toLowerCase().includes(searchTerm.toLowerCase())
    return matchEstado && matchSearch
  })

  const totalFacturas = facturas.length
  const pendientes = facturas.filter(f => f.estado === 'PENDIENTE').length
  const pagadas = facturas.filter(f => f.estado === 'PAGADA').length
  const montoTotal = facturas.filter(f => f.estado !== 'ANULADA').reduce((sum, f) => sum + f.monto, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <EditableBlock bloqueId="header" label="Encabezado">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
                <FileText className="w-8 h-8 text-amber-500" />
                <TextoEditable id="titulo-facturacion" original="Facturación" tag="span" />
              </h1>
              <p className="text-stone-500 mt-1"><TextoEditable id="subtitulo-facturacion" original="Gestión de facturas y comprobantes" tag="span" /></p>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchFacturas} variant="outline"><RefreshCw className="w-4 h-4 mr-2" /><TextoEditable id="btn-actualizar-fact" original="Actualizar" tag="span" /></Button>
              <Button onClick={handleNuevaFactura} className="bg-amber-500 hover:bg-amber-600"><Plus className="w-4 h-4 mr-2" /><TextoEditable id="btn-nueva-factura" original="Nueva Factura" tag="span" /></Button>
            </div>
          </div>
        </EditableBlock>

        {/* Summary Cards */}
        <EditableBlock bloqueId="resumen" label="Tarjetas de Resumen">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltroEstado('TODOS')}>
              <CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-stone-100 rounded-lg"><FileText className="w-5 h-5 text-stone-600" /></div><div><p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-total-facturas" original="Total Facturas" tag="span" /></p><p className="text-2xl font-bold text-stone-800">{totalFacturas}</p></div></div></CardContent>
            </Card>
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltroEstado('PENDIENTE')}>
              <CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-amber-50 rounded-lg"><DollarSign className="w-5 h-5 text-amber-600" /></div><div><p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-pendientes-fact" original="Pendientes" tag="span" /></p><p className="text-2xl font-bold text-amber-600">{pendientes}</p></div></div></CardContent>
            </Card>
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltroEstado('PAGADA')}>
              <CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-emerald-50 rounded-lg"><CheckCircle className="w-5 h-5 text-emerald-600" /></div><div><p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-pagadas-fact" original="Pagadas" tag="span" /></p><p className="text-2xl font-bold text-emerald-600">{pagadas}</p></div></div></CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-stone-100 rounded-lg"><DollarSign className="w-5 h-5 text-stone-600" /></div><div><p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-monto-total-fact" original="Monto Total" tag="span" /></p><p className="text-lg font-bold text-stone-800">{formatCurrency(montoTotal)}</p></div></div></CardContent>
            </Card>
          </div>
        </EditableBlock>

        {/* Filtros */}
        <EditableBlock bloqueId="filtros" label="Filtros">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input placeholder="Buscar por número o cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <Select value={filtroEstado} onValueChange={(v) => setFiltroEstado(v as typeof filtroEstado)}>
                  <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Filtrar por estado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS"><TextoEditable id="filtro-todos-fact" original="Todos los estados" tag="span" /></SelectItem>
                    <SelectItem value="PENDIENTE"><TextoEditable id="filtro-pendientes-fact" original="Pendientes" tag="span" /></SelectItem>
                    <SelectItem value="PAGADA"><TextoEditable id="filtro-pagadas-fact" original="Pagadas" tag="span" /></SelectItem>
                    <SelectItem value="ANULADA"><TextoEditable id="filtro-anuladas-fact" original="Anuladas" tag="span" /></SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </EditableBlock>

        {/* Tabla de Facturas */}
        <EditableBlock bloqueId="tabla" label="Tabla de Facturas">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg">
              <CardTitle className="text-lg font-semibold flex items-center gap-2"><FileText className="w-5 h-5 text-amber-500" /><TextoEditable id="titulo-listado-fact" original="Listado de Comprobantes" tag="span" /></CardTitle>
              <CardDescription><TextoEditable id="desc-listado-fact" original="Gestión de facturas y remitos del frigorífico" tag="span" /></CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div> :
               facturasFiltradas.length === 0 ? <div className="py-12 text-center text-stone-400"><FileText className="w-16 h-16 mx-auto mb-4 opacity-50" /><p><TextoEditable id="msg-sin-facturas" original="No hay comprobantes que mostrar" tag="span" /></p></div> :
               <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold"><TextoEditable id="th-numero-fact" original="Número" tag="span" /></TableHead>
                      <TableHead className="font-semibold"><TextoEditable id="th-fecha-fact" original="Fecha" tag="span" /></TableHead>
                      <TableHead className="font-semibold"><TextoEditable id="th-cliente-fact" original="Cliente" tag="span" /></TableHead>
                      <TableHead className="font-semibold"><TextoEditable id="th-tipo-fact" original="Tipo" tag="span" /></TableHead>
                      <TableHead className="font-semibold"><TextoEditable id="th-monto-fact" original="Monto" tag="span" /></TableHead>
                      <TableHead className="font-semibold"><TextoEditable id="th-estado-fact" original="Estado" tag="span" /></TableHead>
                      <TableHead className="font-semibold text-right"><TextoEditable id="th-acciones-fact" original="Acciones" tag="span" /></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturasFiltradas.map((factura) => (
                      <TableRow key={factura.id} className="hover:bg-stone-50">
                        <TableCell className="font-mono font-medium">{factura.numero}</TableCell>
                        <TableCell>{new Date(factura.fecha).toLocaleDateString('es-AR')}</TableCell>
                        <TableCell>{factura.cliente}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{TIPOS_COMPROBANTE.find(t => t.value === factura.tipoComprobante)?.label}</Badge></TableCell>
                        <TableCell className="font-medium">{formatCurrency(factura.monto)}</TableCell>
                        <TableCell>{getEstadoBadge(factura.estado)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleImprimir(factura)} title="Imprimir" disabled={factura.estado === 'ANULADA'}><Printer className="w-4 h-4" /></Button>
                            {factura.estado === 'PENDIENTE' && <Button variant="ghost" size="icon" onClick={() => handleMarcarPagada(factura)} title="Marcar como pagada" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"><CheckCircle className="w-4 h-4" /></Button>}
                            {factura.estado !== 'ANULADA' && <Button variant="ghost" size="icon" onClick={() => handleAnular(factura)} title="Anular" className="text-red-500 hover:text-red-600 hover:bg-red-50"><XCircle className="w-4 h-4" /></Button>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
               </div>}
            </CardContent>
          </Card>
        </EditableBlock>

        {/* Dialog Nueva Factura */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-amber-600" /><TextoEditable id="titulo-nueva-factura" original="Nueva Factura" tag="span" /></DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label><TextoEditable id="label-cliente-form-fact" original="Cliente" tag="span" /></Label><Select value={formData.cliente} onValueChange={(v) => setFormData({ ...formData, cliente: v })}><SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger><SelectContent>{CLIENTES_SIMULADOS.map((c) => (<SelectItem key={c.id} value={c.nombre}>{c.nombre}</SelectItem>))}</SelectContent></Select></div>
              <div className="space-y-2"><Label><TextoEditable id="label-tipo-form-fact" original="Tipo de Comprobante" tag="span" /></Label><Select value={formData.tipoComprobante} onValueChange={(v) => setFormData({ ...formData, tipoComprobante: v as typeof formData.tipoComprobante })}><SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger><SelectContent>{TIPOS_COMPROBANTE.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label><TextoEditable id="label-numero-form-fact" original="Número" tag="span" /></Label><Input id="numero" value={formData.numero} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} placeholder="0001-00000001" /></div>
                <div className="space-y-2"><Label><TextoEditable id="label-fecha-form-fact" original="Fecha" tag="span" /></Label><Input id="fecha" type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label><TextoEditable id="label-monto-form-fact" original="Monto" tag="span" /></Label><Input id="monto" type="number" value={formData.monto || ''} onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })} placeholder="0.00" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}><TextoEditable id="btn-cancelar-form-fact" original="Cancelar" tag="span" /></Button>
              <Button onClick={handleGuardar} disabled={saving} className="bg-amber-500 hover:bg-amber-600">{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}{saving ? <TextoEditable id="btn-guardando-form-fact" original="Guardando..." tag="span" /> : <TextoEditable id="btn-crear-form-fact" original="Crear Factura" tag="span" />}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Anular */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle className="text-red-600 flex items-center gap-2"><XCircle className="w-5 h-5" /><TextoEditable id="titulo-anular-fact" original="Anular Factura" tag="span" /></DialogTitle></DialogHeader>
            <p className="text-sm text-stone-500"><TextoEditable id="msg-confirmar-anular" original="¿Está seguro que desea anular esta factura? Esta acción no se puede deshacer." tag="span" /></p>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setDeleteOpen(false)}><TextoEditable id="btn-cancelar-anular" original="Cancelar" tag="span" /></Button>
              <Button onClick={handleConfirmarAnular} disabled={saving} className="bg-red-600 hover:bg-red-700">{saving ? <TextoEditable id="btn-anulando-fact" original="Anulando..." tag="span" /> : <TextoEditable id="btn-anular-factura" original="Anular Factura" tag="span" />}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default FacturacionModule
