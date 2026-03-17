'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  Truck, Loader2, RefreshCw, Plus, Send, Package
} from 'lucide-react'
import { TextoEditable, EditableBlock, useEditor } from '@/components/ui/editable-screen'

interface Operador {
  id: string
  nombre: string
  rol: string
  permisos?: Record<string, boolean>
}

interface Expedicion {
  id: string
  fecha: string
  tropaCodigo: string
  destino: string
  cantidadCajones: number
  pesoTotal: number
  estado: 'PREPARANDO' | 'LISTO' | 'DESPACHADO'
  transportista: string
  patente: string
  operador: string
}

interface Props {
  operador: Operador
}

export function ExpedicionModule({ operador }: Props) {
  const { editMode, getTexto, setTexto, getBloque, updateBloque } = useEditor()
  const [expediciones, setExpediciones] = useState<Expedicion[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'TODOS' | 'PREPARANDO' | 'LISTO' | 'DESPACHADO'>('TODOS')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchExpediciones()
  }, [])

  const fetchExpediciones = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setExpediciones([
        {
          id: '1',
          fecha: new Date().toISOString(),
          tropaCodigo: 'B 2026 0008',
          destino: 'Carnicería Don José',
          cantidadCajones: 24,
          pesoTotal: 1200,
          estado: 'LISTO',
          transportista: 'Transportes López',
          patente: 'AB 123 CD',
          operador: 'Juan Pérez'
        },
        {
          id: '2',
          fecha: new Date().toISOString(),
          tropaCodigo: 'B 2026 0007',
          destino: 'Supermercados del Valle',
          cantidadCajones: 36,
          pesoTotal: 1800,
          estado: 'PREPARANDO',
          transportista: 'Logística Norte',
          patente: 'CD 456 EF',
          operador: 'María García'
        },
        {
          id: '3',
          fecha: new Date(Date.now() - 86400000).toISOString(),
          tropaCodigo: 'B 2026 0006',
          destino: 'Frigorífico Regional',
          cantidadCajones: 18,
          pesoTotal: 900,
          estado: 'DESPACHADO',
          transportista: 'Transportes López',
          patente: 'GH 789 IJ',
          operador: 'Carlos López'
        }
      ])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar expediciones')
    } finally {
      setLoading(false)
    }
  }

  const handleDespachar = async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setExpediciones(expediciones.map(e => 
        e.id === id ? { ...e, estado: 'DESPACHADO' } : e
      ))
      
      toast.success('Expedición despachada correctamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al despachar')
    }
  }

  const handleMarcarListo = async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setExpediciones(expediciones.map(e => 
        e.id === id ? { ...e, estado: 'LISTO' } : e
      ))
      
      toast.success('Expedición marcada como lista')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al actualizar')
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PREPARANDO':
        return <Badge className="bg-amber-100 text-amber-700"><TextoEditable id="estado-preparando" original="Preparando" tag="span" /></Badge>
      case 'LISTO':
        return <Badge className="bg-blue-100 text-blue-700"><TextoEditable id="estado-listo-despachar" original="Listo para despachar" tag="span" /></Badge>
      case 'DESPACHADO':
        return <Badge className="bg-emerald-100 text-emerald-700"><TextoEditable id="estado-despachado" original="Despachado" tag="span" /></Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const expedicionesFiltradas = expediciones.filter(e => 
    filtro === 'TODOS' || e.estado === filtro
  )

  const preparando = expediciones.filter(e => e.estado === 'PREPARANDO').length
  const listos = expediciones.filter(e => e.estado === 'LISTO').length
  const despachados = expediciones.filter(e => e.estado === 'DESPACHADO').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <EditableBlock bloqueId="header" label="Encabezado">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
                <Truck className="w-8 h-8 text-amber-500" />
                <TextoEditable id="expedicion-titulo" original="Expedición" tag="span" />
              </h1>
              <p className="text-stone-500 mt-1">
                <TextoEditable id="expedicion-subtitulo" original="Gestión de expediciones y despachos" tag="span" />
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchExpediciones} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                <TextoEditable id="btn-actualizar" original="Actualizar" tag="span" />
              </Button>
              <Button className="bg-amber-500 hover:bg-amber-600">
                <Plus className="w-4 h-4 mr-2" />
                <TextoEditable id="btn-nueva-expedicion" original="Nueva Expedición" tag="span" />
              </Button>
            </div>
          </div>
        </EditableBlock>

        {/* Resumen */}
        <EditableBlock bloqueId="resumenCards" label="Tarjetas de Resumen">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('TODOS')}>
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-total" original="Total" tag="span" /></p>
                <p className="text-3xl font-bold text-stone-800">{expediciones.length}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('PREPARANDO')}>
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-preparando" original="Preparando" tag="span" /></p>
                <p className="text-3xl font-bold text-amber-600">{preparando}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('LISTO')}>
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-listos" original="Listos" tag="span" /></p>
                <p className="text-3xl font-bold text-blue-600">{listos}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('DESPACHADO')}>
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-despachados" original="Despachados" tag="span" /></p>
                <p className="text-3xl font-bold text-emerald-600">{despachados}</p>
              </CardContent>
            </Card>
          </div>
        </EditableBlock>

        {/* Filtros */}
        <EditableBlock bloqueId="filtros" label="Filtros">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-stone-600"><TextoEditable id="label-filtrar" original="Filtrar" tag="span" />:</span>
                <div className="flex gap-2">
                  {(['TODOS', 'PREPARANDO', 'LISTO', 'DESPACHADO'] as const).map((f) => (
                    <Button
                      key={f}
                      variant={filtro === f ? 'default' : 'outline'}
                      size="sm"
                      className={filtro === f ? 'bg-amber-500 hover:bg-amber-600' : ''}
                      onClick={() => setFiltro(f)}
                    >
                      {f === 'TODOS' ? <TextoEditable id="filtro-todos" original="Todos" tag="span" /> : 
                       f === 'LISTO' ? <TextoEditable id="filtro-listos" original="Listos" tag="span" /> : 
                       f === 'PREPARANDO' ? <TextoEditable id="filtro-preparando" original="Preparando" tag="span" /> : 
                       <TextoEditable id="filtro-despachados" original="Despachados" tag="span" />}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </EditableBlock>

        {/* Tabla de expediciones */}
        <EditableBlock bloqueId="tablaExpediciones" label="Tabla de Expediciones">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                <TextoEditable id="titulo-expediciones" original="Expediciones" tag="span" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
              ) : expedicionesFiltradas.length === 0 ? (
                <div className="py-12 text-center text-stone-400">
                  <Truck className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p><TextoEditable id="msg-no-hay-expediciones" original="No hay expediciones" tag="span" /></p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead><TextoEditable id="th-fecha" original="Fecha" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-tropa" original="Tropa" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-destino" original="Destino" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-cajones" original="Cajones" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-peso" original="Peso" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-transportista" original="Transportista" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-estado" original="Estado" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-acciones" original="Acciones" tag="span" /></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expedicionesFiltradas.map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell>
                          {new Date(exp.fecha).toLocaleDateString('es-AR')}
                        </TableCell>
                        <TableCell className="font-mono font-medium">{exp.tropaCodigo}</TableCell>
                        <TableCell>{exp.destino}</TableCell>
                        <TableCell>{exp.cantidadCajones}</TableCell>
                        <TableCell>{exp.pesoTotal.toLocaleString()} kg</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{exp.transportista}</p>
                            <p className="text-xs text-stone-400">{exp.patente}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getEstadoBadge(exp.estado)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {exp.estado === 'PREPARANDO' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarcarListo(exp.id)}
                              >
                                <TextoEditable id="btn-listo" original="Listo" tag="span" />
                              </Button>
                            )}
                            {exp.estado === 'LISTO' && (
                              <Button
                                size="sm"
                                className="bg-emerald-500 hover:bg-emerald-600"
                                onClick={() => handleDespachar(exp.id)}
                              >
                                <Send className="w-4 h-4 mr-1" />
                                <TextoEditable id="btn-despachar" original="Despachar" tag="span" />
                              </Button>
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

export default ExpedicionModule
