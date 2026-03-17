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
  Package, Loader2, RefreshCw, Plus, ArrowRight
} from 'lucide-react'
import { TextoEditable, EditableBlock, useEditor } from '@/components/ui/editable-screen'

interface Operador {
  id: string
  nombre: string
  rol: string
  permisos?: Record<string, boolean>
}

interface IngresoDespostada {
  id: string
  fecha: string
  tropaCodigo: string
  mediaCodigo: string
  tipoMedia: 'DELANTERA' | 'TRASERA'
  pesoKg: number
  origen: string
  destino: string
  estado: 'PENDIENTE' | 'INGRESADO' | 'EN_PROCESO'
  operador: string
}

interface Props {
  operador: Operador
}

export function IngresoDespostadaModule({ operador }: Props) {
  const { editMode, getTexto, setTexto, getBloque, updateBloque } = useEditor()
  const [ingresos, setIngresos] = useState<IngresoDespostada[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'TODOS' | 'PENDIENTE' | 'INGRESADO' | 'EN_PROCESO'>('PENDIENTE')
  
  const [tropaCodigo, setTropaCodigo] = useState('')
  const [mediaCodigo, setMediaCodigo] = useState('')
  const [tipoMedia, setTipoMedia] = useState<'DELANTERA' | 'TRASERA'>('DELANTERA')
  const [pesoKg, setPesoKg] = useState('')
  const [destino, setDestino] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchIngresos()
  }, [])

  const fetchIngresos = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setIngresos([
        { id: '1', fecha: new Date().toISOString(), tropaCodigo: 'B 2026 0008', mediaCodigo: 'MED-001-D', tipoMedia: 'DELANTERA', pesoKg: 85, origen: 'Cámara 1', destino: 'Despostada 1', estado: 'PENDIENTE', operador: 'Juan Pérez' },
        { id: '2', fecha: new Date().toISOString(), tropaCodigo: 'B 2026 0008', mediaCodigo: 'MED-001-T', tipoMedia: 'TRASERA', pesoKg: 95, origen: 'Cámara 1', destino: 'Despostada 1', estado: 'INGRESADO', operador: 'María García' },
        { id: '3', fecha: new Date(Date.now() - 3600000).toISOString(), tropaCodigo: 'B 2026 0007', mediaCodigo: 'MED-002-D', tipoMedia: 'DELANTERA', pesoKg: 82, origen: 'Cámara 2', destino: 'Despostada 2', estado: 'EN_PROCESO', operador: 'Carlos López' }
      ])
    } catch (error) {
      toast.error('Error al cargar ingresos')
    } finally {
      setLoading(false)
    }
  }

  const handleIngresar = async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      setIngresos(ingresos.map(i => i.id === id ? { ...i, estado: 'INGRESADO' } : i))
      toast.success('Media ingresada a despostada')
    } catch (error) {
      toast.error('Error al ingresar')
    }
  }

  const handleNuevoIngreso = async () => {
    if (!tropaCodigo || !mediaCodigo || !pesoKg || !destino) {
      toast.error('Complete todos los campos obligatorios')
      return
    }
    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      const nuevoIngreso: IngresoDespostada = {
        id: Date.now().toString(),
        fecha: new Date().toISOString(),
        tropaCodigo,
        mediaCodigo,
        tipoMedia,
        pesoKg: parseFloat(pesoKg),
        origen: 'Cámara 1',
        destino,
        estado: 'PENDIENTE',
        operador: operador.nombre
      }
      setIngresos([nuevoIngreso, ...ingresos])
      setTropaCodigo('')
      setMediaCodigo('')
      setPesoKg('')
      setDestino('')
      toast.success('Ingreso registrado correctamente')
    } catch (error) {
      toast.error('Error al registrar ingreso')
    } finally {
      setSaving(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Badge className="bg-amber-100 text-amber-700"><TextoEditable id="estado-pendiente" original="Pendiente" tag="span" /></Badge>
      case 'INGRESADO':
        return <Badge className="bg-blue-100 text-blue-700"><TextoEditable id="estado-ingresado" original="Ingresado" tag="span" /></Badge>
      case 'EN_PROCESO':
        return <Badge className="bg-purple-100 text-purple-700"><TextoEditable id="estado-en-proceso" original="En Proceso" tag="span" /></Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const getTipoBadge = (tipo: string) => {
    return tipo === 'DELANTERA' 
      ? <Badge variant="outline" className="border-emerald-300 text-emerald-700"><TextoEditable id="tipo-delantera" original="Delantera" tag="span" /></Badge>
      : <Badge variant="outline" className="border-purple-300 text-purple-700"><TextoEditable id="tipo-trasera" original="Trasera" tag="span" /></Badge>
  }

  const ingresosFiltrados = ingresos.filter(i => filtro === 'TODOS' || i.estado === filtro)
  const pendientes = ingresos.filter(i => i.estado === 'PENDIENTE').length
  const ingresados = ingresos.filter(i => i.estado === 'INGRESADO').length
  const enProceso = ingresos.filter(i => i.estado === 'EN_PROCESO').length
  const pesoTotal = ingresos.reduce((acc, i) => acc + i.pesoKg, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <EditableBlock bloqueId="header" label="Encabezado">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
                <Package className="w-8 h-8 text-amber-500" />
                <TextoEditable id="ingreso-despostada-titulo" original="Ingreso a Despostada" tag="span" />
              </h1>
              <p className="text-stone-500 mt-1">
                <TextoEditable id="ingreso-despostada-subtitulo" original="Control de medias ingresadas a despostada" tag="span" />
              </p>
            </div>
            <Button onClick={fetchIngresos} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              <TextoEditable id="btn-actualizar" original="Actualizar" tag="span" />
            </Button>
          </div>
        </EditableBlock>

        {/* Resumen */}
        <EditableBlock bloqueId="resumenCards" label="Tarjetas de Resumen">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('TODOS')}>
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-total" original="Total" tag="span" /></p>
                <p className="text-3xl font-bold text-stone-800">{ingresos.length}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('PENDIENTE')}>
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-pendientes" original="Pendientes" tag="span" /></p>
                <p className="text-3xl font-bold text-amber-600">{pendientes}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('INGRESADO')}>
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-ingresados" original="Ingresados" tag="span" /></p>
                <p className="text-3xl font-bold text-blue-600">{ingresados}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('EN_PROCESO')}>
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-en-proceso" original="En Proceso" tag="span" /></p>
                <p className="text-3xl font-bold text-purple-600">{enProceso}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-peso-total" original="Peso Total" tag="span" /></p>
                <p className="text-3xl font-bold text-stone-800">{pesoTotal.toLocaleString()} kg</p>
              </CardContent>
            </Card>
          </div>
        </EditableBlock>

        {/* Formulario */}
        <EditableBlock bloqueId="formulario" label="Formulario">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-500" />
                <TextoEditable id="titulo-nuevo-ingreso" original="Nuevo Ingreso" tag="span" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <Label><TextoEditable id="label-tropa" original="Tropa" tag="span" /> *</Label>
                  <Input value={tropaCodigo} onChange={(e) => setTropaCodigo(e.target.value)} placeholder="B 2026 0001" />
                </div>
                <div className="space-y-2">
                  <Label><TextoEditable id="label-media" original="Media" tag="span" /> *</Label>
                  <Input value={mediaCodigo} onChange={(e) => setMediaCodigo(e.target.value)} placeholder="MED-001-D" />
                </div>
                <div className="space-y-2">
                  <Label><TextoEditable id="label-tipo" original="Tipo" tag="span" /> *</Label>
                  <Select value={tipoMedia} onValueChange={(v) => setTipoMedia(v as 'DELANTERA' | 'TRASERA')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DELANTERA"><TextoEditable id="opt-delantera" original="Delantera" tag="span" /></SelectItem>
                      <SelectItem value="TRASERA"><TextoEditable id="opt-trasera" original="Trasera" tag="span" /></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label><TextoEditable id="label-peso-kg" original="Peso (Kg)" tag="span" /> *</Label>
                  <Input type="number" value={pesoKg} onChange={(e) => setPesoKg(e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label><TextoEditable id="label-destino" original="Destino" tag="span" /> *</Label>
                  <Select value={destino} onValueChange={setDestino}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Despostada 1">Despostada 1</SelectItem>
                      <SelectItem value="Despostada 2">Despostada 2</SelectItem>
                      <SelectItem value="Despostada 3">Despostada 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleNuevoIngreso} className="w-full bg-amber-500 hover:bg-amber-600" disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                    <TextoEditable id="btn-registrar" original="Registrar" tag="span" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </EditableBlock>

        {/* Tabla */}
        <EditableBlock bloqueId="tablaIngresos" label="Tabla de Ingresos">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg">
              <CardTitle className="text-lg font-semibold">
                <TextoEditable id="titulo-medias" original="Medias" tag="span" /> {filtro !== 'TODOS' ? `- ${filtro}` : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
              ) : ingresosFiltrados.length === 0 ? (
                <div className="py-12 text-center text-stone-400">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p><TextoEditable id="msg-no-hay-ingresos" original="No hay ingresos" tag="span" /> {filtro.toLowerCase()}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead><TextoEditable id="th-fecha" original="Fecha" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-tropa" original="Tropa" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-media" original="Media" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-tipo" original="Tipo" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-peso" original="Peso" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-origen" original="Origen" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-destino" original="Destino" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-estado" original="Estado" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-acciones" original="Acciones" tag="span" /></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ingresosFiltrados.map((ing) => (
                      <TableRow key={ing.id}>
                        <TableCell>{new Date(ing.fecha).toLocaleDateString('es-AR')}</TableCell>
                        <TableCell className="font-mono">{ing.tropaCodigo}</TableCell>
                        <TableCell className="font-mono">{ing.mediaCodigo}</TableCell>
                        <TableCell>{getTipoBadge(ing.tipoMedia)}</TableCell>
                        <TableCell>{ing.pesoKg} kg</TableCell>
                        <TableCell>{ing.origen}</TableCell>
                        <TableCell>{ing.destino}</TableCell>
                        <TableCell>{getEstadoBadge(ing.estado)}</TableCell>
                        <TableCell>
                          {ing.estado === 'PENDIENTE' && (
                            <Button size="sm" className="bg-blue-500 hover:bg-blue-600" onClick={() => handleIngresar(ing.id)}>
                              <ArrowRight className="w-4 h-4 mr-1" />
                              <TextoEditable id="btn-ingresar" original="Ingresar" tag="span" />
                            </Button>
                          )}
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

export default IngresoDespostadaModule
