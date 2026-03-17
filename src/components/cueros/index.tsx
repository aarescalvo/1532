'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import {
  Package, Loader2, RefreshCw, Plus, CheckCircle,
  Truck, Scale, Archive
} from 'lucide-react'
import { TextoEditable, EditableBlock, useEditor } from '@/components/ui/editable-screen'

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Cuero {
  id: string
  fecha: string
  tropaCodigo: string
  cantidad: number
  pesoKg: number
  conservacion: 'SALADO' | 'FRESCO'
  destino: string
  estado: 'PENDIENTE' | 'PROCESADO' | 'DESPACHADO'
  operador: string
  fechaProcesado?: string
  fechaDespachado?: string
}

interface Props {
  operador: Operador
}

export function CuerosModule({ operador }: Props) {
  const { editMode, getTexto } = useEditor()
  // Simulated data with hardcoded examples
  const [cueros, setCueros] = useState<Cuero[]>([
    {
      id: '1',
      fecha: new Date().toISOString(),
      tropaCodigo: 'T-2024-001',
      cantidad: 45,
      pesoKg: 1850.5,
      conservacion: 'SALADO',
      destino: 'Curtiembre San Martín',
      estado: 'PENDIENTE',
      operador: 'Carlos Rodríguez'
    },
    {
      id: '2',
      fecha: new Date(Date.now() - 86400000).toISOString(),
      tropaCodigo: 'T-2024-002',
      cantidad: 38,
      pesoKg: 1620.0,
      conservacion: 'FRESCO',
      destino: 'Frigorífico Norte',
      estado: 'PROCESADO',
      operador: 'María García',
      fechaProcesado: new Date(Date.now() - 43200000).toISOString()
    },
    {
      id: '3',
      fecha: new Date(Date.now() - 172800000).toISOString(),
      tropaCodigo: 'T-2024-003',
      cantidad: 52,
      pesoKg: 2100.0,
      conservacion: 'SALADO',
      destino: 'Exportación Brasil',
      estado: 'DESPACHADO',
      operador: 'Juan Pérez',
      fechaProcesado: new Date(Date.now() - 129600000).toISOString(),
      fechaDespachado: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: '4',
      fecha: new Date(Date.now() - 259200000).toISOString(),
      tropaCodigo: 'T-2024-004',
      cantidad: 30,
      pesoKg: 1250.0,
      conservacion: 'SALADO',
      destino: 'Curtiembre del Valle',
      estado: 'PROCESADO',
      operador: 'Ana Martínez',
      fechaProcesado: new Date(Date.now() - 216000000).toISOString()
    },
    {
      id: '5',
      fecha: new Date(Date.now() - 345600000).toISOString(),
      tropaCodigo: 'T-2024-005',
      cantidad: 48,
      pesoKg: 1920.5,
      conservacion: 'FRESCO',
      destino: 'Mercado Local',
      estado: 'PENDIENTE',
      operador: 'Pedro Sánchez'
    }
  ])

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [tropaCodigo, setTropaCodigo] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [pesoKg, setPesoKg] = useState('')
  const [conservacion, setConservacion] = useState<'SALADO' | 'FRESCO'>('SALADO')
  const [destino, setDestino] = useState('')

  // Summary calculations
  const totalCueros = cueros.reduce((acc, c) => acc + c.cantidad, 0)
  const pendientes = cueros.filter(c => c.estado === 'PENDIENTE')
  const procesados = cueros.filter(c => c.estado === 'PROCESADO')
  const totalPeso = cueros.reduce((acc, c) => acc + c.pesoKg, 0)

  const handleRefresh = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setLoading(false)
    toast.success('Datos actualizados')
  }

  const handleRegistrar = async () => {
    if (!tropaCodigo || !cantidad || !pesoKg || !destino) {
      toast.error('Complete todos los campos obligatorios')
      return
    }

    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 500))

    const nuevoCuero: Cuero = {
      id: Date.now().toString(),
      fecha: new Date().toISOString(),
      tropaCodigo,
      cantidad: parseInt(cantidad),
      pesoKg: parseFloat(pesoKg),
      conservacion,
      destino,
      estado: 'PENDIENTE',
      operador: operador.nombre
    }

    setCueros([nuevoCuero, ...cueros])
    setTropaCodigo('')
    setCantidad('')
    setPesoKg('')
    setDestino('')
    setSaving(false)
    toast.success('Cuero registrado correctamente')
  }

  const handleProcesar = async (id: string) => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 300))

    setCueros(cueros.map(c => 
      c.id === id 
        ? { ...c, estado: 'PROCESADO' as const, fechaProcesado: new Date().toISOString() }
        : c
    ))
    setSaving(false)
    toast.success('Cuero procesado correctamente')
  }

  const handleDespachar = async (id: string) => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 300))

    setCueros(cueros.map(c => 
      c.id === id 
        ? { ...c, estado: 'DESPACHADO' as const, fechaDespachado: new Date().toISOString() }
        : c
    ))
    setSaving(false)
    toast.success('Cuero despachado correctamente')
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200"><TextoEditable id="estado-pendiente-cuero" original="PENDIENTE" tag="span" /></Badge>
      case 'PROCESADO':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200"><TextoEditable id="estado-procesado-cuero" original="PROCESADO" tag="span" /></Badge>
      case 'DESPACHADO':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-200"><TextoEditable id="estado-despachado-cuero" original="DESPACHADO" tag="span" /></Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  const getConservacionBadge = (conservacion: string) => {
    return conservacion === 'SALADO' 
      ? <Badge variant="outline" className="border-amber-300 text-amber-700"><TextoEditable id="conservacion-salado" original="Salado" tag="span" /></Badge>
      : <Badge variant="outline" className="border-stone-300 text-stone-700"><TextoEditable id="conservacion-fresco" original="Fresco" tag="span" /></Badge>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <EditableBlock bloqueId="header" label="Encabezado">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
                <Package className="w-8 h-8 text-amber-500" />
                <TextoEditable id="titulo-cueros" original="Control de Cueros" tag="span" />
              </h1>
              <p className="text-stone-500 mt-1">
                <TextoEditable id="subtitulo-cueros" original="Seguimiento de cueros como subproducto del frigorífico" tag="span" />
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRefresh} variant="outline" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                <TextoEditable id="btn-actualizar-cueros" original="Actualizar" tag="span" />
              </Button>
            </div>
          </div>
        </EditableBlock>

        {/* Summary Cards */}
        <EditableBlock bloqueId="resumen" label="Tarjetas de Resumen">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-total-cueros" original="Total Cueros" tag="span" /></p>
                    <p className="text-3xl font-bold text-stone-800">{totalCueros}</p>
                  </div>
                  <Package className="w-8 h-8 text-stone-300" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-pendientes-cueros" original="Pendientes" tag="span" /></p>
                    <p className="text-3xl font-bold text-amber-600">{pendientes.length}</p>
                  </div>
                  <Archive className="w-8 h-8 text-amber-300" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-procesados-cueros" original="Procesados" tag="span" /></p>
                    <p className="text-3xl font-bold text-blue-600">{procesados.length}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-blue-300" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-peso-total-cueros" original="Peso Total" tag="span" /></p>
                    <p className="text-3xl font-bold text-stone-800">{totalPeso.toLocaleString('es-AR', { maximumFractionDigits: 1 })}</p>
                    <p className="text-xs text-stone-400">kg</p>
                  </div>
                  <Scale className="w-8 h-8 text-stone-300" />
                </div>
              </CardContent>
            </Card>
          </div>
        </EditableBlock>

        {/* Registration Form */}
        <EditableBlock bloqueId="formulario" label="Formulario de Registro">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-500" />
                <TextoEditable id="titulo-form-cueros" original="Registro de Cueros" tag="span" />
              </CardTitle>
              <CardDescription>
                <TextoEditable id="desc-form-cueros" original="Registre los cueros provenientes de la faena" tag="span" />
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tropa"><TextoEditable id="label-codigo-tropa-cuero" original="Código Tropa *" tag="span" /></Label>
                  <Input
                    id="tropa"
                    value={tropaCodigo}
                    onChange={(e) => setTropaCodigo(e.target.value)}
                    placeholder="T-2024-XXX"
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cantidad"><TextoEditable id="label-cantidad-cuero" original="Cantidad *" tag="span" /></Label>
                  <Input
                    id="cantidad"
                    type="number"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="peso"><TextoEditable id="label-peso-cuero" original="Peso (kg) *" tag="span" /></Label>
                  <Input
                    id="peso"
                    type="number"
                    step="0.1"
                    value={pesoKg}
                    onChange={(e) => setPesoKg(e.target.value)}
                    placeholder="0.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conservacion"><TextoEditable id="label-conservacion-cuero" original="Conservación *" tag="span" /></Label>
                  <Select value={conservacion} onValueChange={(v: 'SALADO' | 'FRESCO') => setConservacion(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SALADO">Salado</SelectItem>
                      <SelectItem value="FRESCO">Fresco</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destino"><TextoEditable id="label-destino-cuero" original="Destino *" tag="span" /></Label>
                  <Input
                    id="destino"
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                    placeholder="Curtiembre / Cliente"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={handleRegistrar}
                    className="w-full bg-amber-500 hover:bg-amber-600"
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    <TextoEditable id="btn-registrar-cuero" original="Registrar" tag="span" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </EditableBlock>

        {/* Data Table */}
        <EditableBlock bloqueId="tabla" label="Tabla de Cueros">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg">
              <CardTitle className="text-lg font-semibold">
                <TextoEditable id="titulo-historial-cueros" original="Historial de Cueros" tag="span" />
              </CardTitle>
              <CardDescription>
                <TextoEditable id="desc-historial-cueros" original="Listado completo de cueros registrados" tag="span" />
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
              ) : cueros.length === 0 ? (
                <div className="py-12 text-center text-stone-400">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p><TextoEditable id="msg-sin-cueros" original="No hay cueros registrados" tag="span" /></p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead><TextoEditable id="th-fecha-cuero" original="Fecha" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-tropa-cuero" original="Tropa" tag="span" /></TableHead>
                      <TableHead className="text-center"><TextoEditable id="th-cantidad-cuero" original="Cantidad" tag="span" /></TableHead>
                      <TableHead className="text-right"><TextoEditable id="th-peso-tabla-cuero" original="Peso (kg)" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-conservacion-tabla" original="Conservación" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-destino-tabla" original="Destino" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-estado-cuero" original="Estado" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-operador-cuero" original="Operador" tag="span" /></TableHead>
                      <TableHead className="text-center"><TextoEditable id="th-acciones-cuero" original="Acciones" tag="span" /></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cueros.map((cuero) => (
                      <TableRow key={cuero.id}>
                        <TableCell className="font-medium">
                          {new Date(cuero.fecha).toLocaleDateString('es-AR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell className="font-mono">{cuero.tropaCodigo}</TableCell>
                        <TableCell className="text-center font-bold">{cuero.cantidad}</TableCell>
                        <TableCell className="text-right font-bold text-amber-600">
                          {cuero.pesoKg.toLocaleString('es-AR', { maximumFractionDigits: 1 })}
                        </TableCell>
                        <TableCell>{getConservacionBadge(cuero.conservacion)}</TableCell>
                        <TableCell>{cuero.destino}</TableCell>
                        <TableCell>{getEstadoBadge(cuero.estado)}</TableCell>
                        <TableCell>{cuero.operador}</TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            {cuero.estado === 'PENDIENTE' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleProcesar(cuero.id)}
                                disabled={saving}
                                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                <TextoEditable id="btn-procesar-cuero" original="Procesar" tag="span" />
                              </Button>
                            )}
                            {cuero.estado === 'PROCESADO' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDespachar(cuero.id)}
                                disabled={saving}
                                className="border-green-300 text-green-600 hover:bg-green-50"
                              >
                                <Truck className="w-4 h-4 mr-1" />
                                <TextoEditable id="btn-despachar-cuero" original="Despachar" tag="span" />
                              </Button>
                            )}
                            {cuero.estado === 'DESPACHADO' && (
                              <span className="text-xs text-stone-400 italic px-2">
                                <TextoEditable id="msg-completado-cuero" original="Completado" tag="span" />
                              </span>
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

        {/* Info Footer */}
        <div className="text-center text-sm text-stone-400 py-4">
          <p><TextoEditable id="footer-modulo-cueros" original="Módulo de Control de Cueros - Frigorífico" tag="span" /></p>
          <p className="text-xs mt-1"><TextoEditable id="footer-operador-cuero" original="Operador:" tag="span" /> {operador.nombre} | <TextoEditable id="footer-rol-cuero" original="Rol:" tag="span" /> {operador.rol}</p>
        </div>
      </div>
    </div>
  )
}

export default CuerosModule
