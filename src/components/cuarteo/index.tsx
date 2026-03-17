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
  Scissors, Loader2, RefreshCw, Plus, Package, CheckCircle
} from 'lucide-react'
import { TextoEditable, EditableBlock, useEditor } from '@/components/ui/editable-screen'

interface Operador {
  id: string
  nombre: string
  rol: string
  permisos?: Record<string, boolean>
}

interface Cuarteo {
  id: string
  fecha: string
  tropaCodigo: string
  animalCodigo: string
  cuartos: string[]
  pesoTotal: number
  camaraDestino: string
  estado: 'EN_PROCESO' | 'COMPLETADO'
  operador: string
}

interface Props {
  operador: Operador
}

export function CuarteoModule({ operador }: Props) {
  const { editMode, getTexto, setTexto, getBloque, updateBloque } = useEditor()
  const [cuarteos, setCuarteos] = useState<Cuarteo[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'TODOS' | 'EN_PROCESO' | 'COMPLETADO'>('EN_PROCESO')
  
  const [tropaCodigo, setTropaCodigo] = useState('')
  const [animalCodigo, setAnimalCodigo] = useState('')
  const [camaraDestino, setCamaraDestino] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCuarteos()
  }, [])

  const fetchCuarteos = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      setCuarteos([
        {
          id: '1',
          fecha: new Date().toISOString(),
          tropaCodigo: 'B 2026 0008',
          animalCodigo: 'B20260008-001',
          cuartos: ['Cuarto Delantero Izq', 'Cuarto Delantero Der', 'Cuarto Trasero Izq', 'Cuarto Trasero Der'],
          pesoTotal: 245,
          camaraDestino: 'Cámara 1',
          estado: 'EN_PROCESO',
          operador: 'Juan Pérez'
        },
        {
          id: '2',
          fecha: new Date().toISOString(),
          tropaCodigo: 'B 2026 0008',
          animalCodigo: 'B20260008-002',
          cuartos: ['Cuarto Delantero Izq', 'Cuarto Delantero Der', 'Cuarto Trasero Izq', 'Cuarto Trasero Der'],
          pesoTotal: 238,
          camaraDestino: 'Cámara 1',
          estado: 'COMPLETADO',
          operador: 'María García'
        }
      ])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar cuarteos')
    } finally {
      setLoading(false)
    }
  }

  const handleCompletar = async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      setCuarteos(cuarteos.map(c => c.id === id ? { ...c, estado: 'COMPLETADO' } : c))
      toast.success('Cuarteo completado correctamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al completar cuarteo')
    }
  }

  const handleIniciarCuarteo = async () => {
    if (!tropaCodigo || !animalCodigo || !camaraDestino) {
      toast.error('Complete todos los campos obligatorios')
      return
    }

    setSaving(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      const nuevoCuarteo: Cuarteo = {
        id: Date.now().toString(),
        fecha: new Date().toISOString(),
        tropaCodigo,
        animalCodigo,
        cuartos: ['Cuarto Delantero Izq', 'Cuarto Delantero Der', 'Cuarto Trasero Izq', 'Cuarto Trasero Der'],
        pesoTotal: 0,
        camaraDestino,
        estado: 'EN_PROCESO',
        operador: operador.nombre
      }
      setCuarteos([nuevoCuarteo, ...cuarteos])
      setTropaCodigo('')
      setAnimalCodigo('')
      setCamaraDestino('')
      toast.success('Cuarteo iniciado correctamente')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al iniciar cuarteo')
    } finally {
      setSaving(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'EN_PROCESO':
        return <Badge className="bg-amber-100 text-amber-700"><TextoEditable id="estado-en-proceso" original="En Proceso" tag="span" /></Badge>
      case 'COMPLETADO':
        return <Badge className="bg-emerald-100 text-emerald-700"><TextoEditable id="estado-completado" original="Completado" tag="span" /></Badge>
      default:
        return <Badge>{estado}</Badge>
    }
  }

  const cuarteosFiltrados = cuarteos.filter(c => filtro === 'TODOS' || c.estado === filtro)
  const enProceso = cuarteos.filter(c => c.estado === 'EN_PROCESO').length
  const completados = cuarteos.filter(c => c.estado === 'COMPLETADO').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <EditableBlock bloqueId="header" label="Encabezado">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
                <Scissors className="w-8 h-8 text-amber-500" />
                <TextoEditable id="cuarteo-titulo" original="Cuarteo" tag="span" />
              </h1>
              <p className="text-stone-500 mt-1">
                <TextoEditable id="cuarteo-subtitulo" original="División de medias en cuartos" tag="span" />
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchCuarteos} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                <TextoEditable id="btn-actualizar" original="Actualizar" tag="span" />
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
                <p className="text-3xl font-bold text-stone-800">{cuarteos.length}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('EN_PROCESO')}>
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-en-proceso" original="En Proceso" tag="span" /></p>
                <p className="text-3xl font-bold text-amber-600">{enProceso}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFiltro('COMPLETADO')}>
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-completados" original="Completados" tag="span" /></p>
                <p className="text-3xl font-bold text-emerald-600">{completados}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <p className="text-xs text-stone-500 uppercase"><TextoEditable id="label-cuartos-animal" original="Cuartos/Animal" tag="span" /></p>
                <p className="text-3xl font-bold text-stone-800">4</p>
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
                <TextoEditable id="titulo-iniciar-cuarteo" original="Iniciar Cuarteo" tag="span" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label><TextoEditable id="label-tropa" original="Tropa" tag="span" /> *</Label>
                  <Input value={tropaCodigo} onChange={(e) => setTropaCodigo(e.target.value)} placeholder="B 2026 0001" />
                </div>
                <div className="space-y-2">
                  <Label><TextoEditable id="label-animal" original="Animal" tag="span" /> *</Label>
                  <Input value={animalCodigo} onChange={(e) => setAnimalCodigo(e.target.value)} placeholder="B20260001-001" />
                </div>
                <div className="space-y-2">
                  <Label><TextoEditable id="label-camara-destino" original="Cámara Destino" tag="span" /> *</Label>
                  <Select value={camaraDestino} onValueChange={setCamaraDestino}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cámara 1">Cámara 1</SelectItem>
                      <SelectItem value="Cámara 2">Cámara 2</SelectItem>
                      <SelectItem value="Cámara 3">Cámara 3</SelectItem>
                      <SelectItem value="Cámara 4">Cámara 4</SelectItem>
                      <SelectItem value="Cámara 5">Cámara 5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleIniciarCuarteo} className="w-full bg-amber-500 hover:bg-amber-600" disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Scissors className="w-4 h-4 mr-2" />}
                    <TextoEditable id="btn-iniciar-cuarteo" original="Iniciar Cuarteo" tag="span" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </EditableBlock>

        {/* Tabla */}
        <EditableBlock bloqueId="tablaCuarteos" label="Tabla de Cuarteos">
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 rounded-t-lg">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                <TextoEditable id="titulo-cuarteos" original="Cuarteos" tag="span" /> {filtro !== 'TODOS' ? `- ${filtro === 'EN_PROCESO' ? 'En Proceso' : 'Completados'}` : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
              ) : cuarteosFiltrados.length === 0 ? (
                <div className="py-12 text-center text-stone-400">
                  <Scissors className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p><TextoEditable id="msg-no-hay-cuarteos" original="No hay cuarteos" tag="span" /> {filtro.toLowerCase()}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead><TextoEditable id="th-fecha" original="Fecha" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-tropa" original="Tropa" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-animal" original="Animal" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-cuartos" original="Cuartos" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-peso" original="Peso" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-camara" original="Cámara" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-estado" original="Estado" tag="span" /></TableHead>
                      <TableHead><TextoEditable id="th-acciones" original="Acciones" tag="span" /></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cuarteosFiltrados.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{new Date(c.fecha).toLocaleDateString('es-AR')}</TableCell>
                        <TableCell className="font-mono">{c.tropaCodigo}</TableCell>
                        <TableCell className="font-mono">{c.animalCodigo}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {c.cuartos.map((cuarto, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {cuarto.replace('Cuarto ', '').substring(0, 2)}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{c.pesoTotal > 0 ? `${c.pesoTotal} kg` : '-'}</TableCell>
                        <TableCell>{c.camaraDestino}</TableCell>
                        <TableCell>{getEstadoBadge(c.estado)}</TableCell>
                        <TableCell>
                          {c.estado === 'EN_PROCESO' && (
                            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600" onClick={() => handleCompletar(c.id)}>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              <TextoEditable id="btn-completar" original="Completar" tag="span" />
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

export default CuarteoModule
