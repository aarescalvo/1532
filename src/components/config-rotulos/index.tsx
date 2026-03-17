'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { 
  Tag, Loader2, Power, Trash2, Upload, Eye, FileText, Printer, 
  Download, Copy, Info, Variable, FileCode, Check, ChevronDown, ChevronRight,
  Settings, Star, Play, X
} from 'lucide-react'
import { TipoRotulo } from '@prisma/client'

interface Operador { id: string; nombre: string; rol: string }
interface Props { operador: Operador }

// Categorías de uso para asignar rótulos
const CATEGORIAS_USO = [
  { value: 'MEDIA_RES', label: 'Media Res', descripcion: 'Rótulo para medias res en romaneo' },
  { value: 'PESAJE_INDIVIDUAL', label: 'Pesaje Individual', descripcion: 'Rótulo para pesaje de animales vivos' },
  { value: 'CUARTO', label: 'Cuarto', descripcion: 'Rótulo para cuartos' },
  { value: 'MENUDENCIA', label: 'Menudencia', descripcion: 'Rótulo para menudencias' },
  { value: 'PRODUCTO_GENERAL', label: 'Producto General', descripcion: 'Rótulo genérico para productos' },
  { value: 'PRODUCTO_ESPECIFICO', label: 'Producto Específico', descripcion: 'Rótulo para un producto en particular' },
]

const TIPOS_IMPRESORA = [
  { value: 'ZEBRA', label: 'Zebra (ZPL)', extensiones: ['.zpl', '.prn', '.nlbl'] },
  { value: 'DATAMAX', label: 'Datamax (DPL)', extensiones: ['.dpl'] },
]

interface VariableDetectada {
  variable: string
  campo: string
  descripcion: string
}

interface Rotulo {
  id: string
  nombre: string
  codigo: string
  tipo: TipoRotulo
  categoria?: string | null
  tipoImpresora: string
  ancho: number
  alto: number
  dpi: number
  contenido: string
  variables?: string | null
  nombreArchivo?: string | null
  diasConsumo?: number | null
  temperaturaMax?: number | null
  activo: boolean
  esDefault: boolean
}

export function ConfigRotulosModule({ operador }: Props) {
  const [rotulos, setRotulos] = useState<Rotulo[]>([])
  const [loading, setLoading] = useState(true)
  const [subiendo, setSubiendo] = useState(false)
  const [modalImportar, setModalImportar] = useState(false)
  const [modalAsignar, setModalAsignar] = useState(false)
  const [modalPreview, setModalPreview] = useState(false)
  const [rotuloSeleccionado, setRotuloSeleccionado] = useState<Rotulo | null>(null)
  const [previewProcesado, setPreviewProcesado] = useState('')
  const [imprimiendo, setImprimiendo] = useState(false)
  
  // Formulario de importación
  const [archivo, setArchivo] = useState<File | null>(null)
  const [contenidoArchivo, setContenidoArchivo] = useState('')
  const [variablesDetectadas, setVariablesDetectadas] = useState<VariableDetectada[]>([])
  const [nombre, setNombre] = useState('')
  const [codigo, setCodigo] = useState('')
  const [categoriaUso, setCategoriaUso] = useState('MEDIA_RES')
  const [tipoImpresora, setTipoImpresora] = useState('ZEBRA')
  const [ancho, setAncho] = useState(80)
  const [alto, setAlto] = useState(50)
  const [dpi, setDpi] = useState(203)
  const [verContenido, setVerContenido] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Datos de prueba para previsualización
  const datosPrueba: Record<string, string> = {
    'FECHA': '17/03/2026',
    'FECHA_FAENA': '17/03/2026',
    'FECHA_VENC': '16/04/2026',
    'TROPA': 'B 2026 0001',
    'GARRON': '0001',
    'PESO': '125.50',
    'PRODUCTO': 'MEDIA RES',
    'ESTABLECIMIENTO': 'FRIGORIFICO EJEMPLO',
    'NRO_ESTABLECIMIENTO': '3986',
    'USUARIO_FAENA': 'JUAN PEREZ',
    'CUIT': '20-12345678-9',
    'MATRICULA': 'MAT-001234',
    'CODIGO_BARRAS': '1234567890123',
    'LOTE': 'L2026001',
    'LADO': 'I',
    'SIGLA': 'A',
    'DIAS_CONSUMO': '30',
    'TEMP_MAX': '5°C',
  }

  // Cargar rótulos
  const cargarRotulos = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/rotulos')
      if (response.ok) {
        const data = await response.json()
        setRotulos(data)
      }
    } catch (error) {
      console.error('Error al cargar rótulos:', error)
      toast.error('Error al cargar rótulos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarRotulos()
  }, [])

  // Procesar ZPL con datos de prueba
  const procesarZplConDatos = (contenido: string, datos: Record<string, string>): string => {
    let resultado = contenido
    // Reemplazar variables {{VAR}}
    Object.entries(datos).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi')
      resultado = resultado.replace(regex, value)
    })
    // Limpiar variables no reemplazadas
    resultado = resultado.replace(/\{\{[A-Z_0-9]+\}\}/g, '---')
    return resultado
  }

  // Ver preview del rótulo
  const handlePreview = (rotulo: Rotulo) => {
    setRotuloSeleccionado(rotulo)
    const procesado = procesarZplConDatos(rotulo.contenido, datosPrueba)
    setPreviewProcesado(procesado)
    setModalPreview(true)
  }

  // Imprimir prueba
  const handleImprimirPrueba = async () => {
    if (!rotuloSeleccionado) return
    
    setImprimiendo(true)
    try {
      const response = await fetch('/api/rotulos/imprimir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rotuloId: rotuloSeleccionado.id,
          datos: datosPrueba,
          modoPrueba: true
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        toast.success('Impresión de prueba enviada')
      } else {
        toast.error(result.error || 'Error al imprimir')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al enviar a impresora')
    } finally {
      setImprimiendo(false)
    }
  }

  // Seleccionar archivo
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const extension = file.name.split('.').pop()?.toLowerCase()
    const extensionesValidas = ['zpl', 'prn', 'dpl', 'nlbl', 'lbl', 'txt']
    
    if (!extensionesValidas.includes(extension || '')) {
      toast.error('El archivo debe ser .zpl, .prn, .nlbl, .lbl, .dpl o .txt')
      return
    }

    // Detectar tipo de impresora por extensión
    if (extension === 'dpl') {
      setTipoImpresora('DATAMAX')
    } else {
      setTipoImpresora('ZEBRA')
    }

    setArchivo(file)
    
    // Para archivos .nlbl y .lbl, son binarios propietarios de Zebra Designer
    if (extension === 'nlbl' || extension === 'lbl') {
      // Los archivos nativos de Zebra Designer están encriptados
      // No se pueden procesar directamente, se guardan para impresión
      setContenidoArchivo(`[Archivo Zebra Designer - ${extension.toUpperCase()}]

⚠️ Este es un archivo de diseño nativo de Zebra Designer (encriptado).
No es posible extraer el código ZPL directamente.

📋 PARA OBTENER EL CÓDIGO ZPL:

OPCIÓN 1 - Print to File:
1. Abra el diseño en Zebra Designer
2. File → Print (o Ctrl+P)
3. Marque "Print to file" 
4. Guarde como .prn

OPCIÓN 2 - Impresora Virtual:
1. Instale "Zebra Printer Driver" 
2. Agregue una impresora Zebra virtual
3. Imprima a archivo desde Zebra Designer

OPCIÓN 3 - Exportar desde Zebra Designer:
1. Tools → Export
2. Seleccione formato ZPL

✅ Este archivo se guardará para impresión directa a la impresora.`)
      setVariablesDetectadas([])
      toast.info('Archivo Zebra Designer detectado. Se guardará para impresión directa.')
    } else {
      // Archivos de texto plano (zpl, prn, dpl, txt)
      const contenido = await file.text()
      setContenidoArchivo(contenido)
      
      const variables = detectarVariables(contenido, extension === 'dpl' ? 'DATAMAX' : 'ZEBRA')
      setVariablesDetectadas(variables)
    }
    
    const nombreBase = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
    setNombre(nombreBase)
    setCodigo(file.name.replace(/\.[^/.]+$/, '').toUpperCase().replace(/\s+/g, '_'))
  }

  // Detectar variables en el contenido
  const detectarVariables = (contenido: string, tipoImpresora: string): VariableDetectada[] => {
    const variables: VariableDetectada[] = []
    const encontradas = new Set<string>()
    
    const regex = tipoImpresora === 'DATAMAX' 
      ? /\{([A-Z_0-9]+)\}/g
      : /\{\{([A-Z_0-9]+)\}\}/g
    
    let match
    while ((match = regex.exec(contenido)) !== null) {
      encontradas.add(match[1])
    }

    const mapeoCampos: Record<string, { campo: string; descripcion: string }> = {
      'FECHA': { campo: 'fechaFaena', descripcion: 'Fecha de faena' },
      'FECHA_FAENA': { campo: 'fechaFaena', descripcion: 'Fecha de faena' },
      'FECHA_VENC': { campo: 'fechaVencimiento', descripcion: 'Fecha vencimiento' },
      'TROPA': { campo: 'tropa', descripcion: 'Código de tropa' },
      'GARRON': { campo: 'garron', descripcion: 'Número de garrón' },
      'PESO': { campo: 'peso', descripcion: 'Peso' },
      'PRODUCTO': { campo: 'nombreProducto', descripcion: 'Nombre del producto' },
      'ESTABLECIMIENTO': { campo: 'establecimiento', descripcion: 'Establecimiento' },
      'NRO_ESTABLECIMIENTO': { campo: 'nroEstablecimiento', descripcion: 'N° Establecimiento' },
      'USUARIO_FAENA': { campo: 'nombreUsuarioFaena', descripcion: 'Usuario de faena' },
      'CUIT': { campo: 'cuit', descripcion: 'CUIT' },
      'MATRICULA': { campo: 'matricula', descripcion: 'Matrícula' },
      'CODIGO_BARRAS': { campo: 'codigoBarras', descripcion: 'Código de barras' },
      'LOTE': { campo: 'lote', descripcion: 'Número de lote' },
      'LADO': { campo: 'ladoMedia', descripcion: 'Lado (I/D)' },
      'SIGLA': { campo: 'siglaMedia', descripcion: 'Sigla' },
      'DIAS_CONSUMO': { campo: 'diasConsumo', descripcion: 'Días de consumo' },
      'TEMP_MAX': { campo: 'temperaturaMax', descripcion: 'Temperatura máxima' },
    }

    encontradas.forEach(variable => {
      const mapeo = mapeoCampos[variable] || { campo: variable.toLowerCase(), descripcion: variable }
      const formatoVar = tipoImpresora === 'DATAMAX' ? `{${variable}}` : `{{${variable}}}`
      variables.push({
        variable: formatoVar,
        campo: mapeo.campo,
        descripcion: mapeo.descripcion
      })
    })

    return variables
  }

  // Subir plantilla
  const handleSubir = async () => {
    if (!archivo || !nombre || !codigo) {
      toast.error('Complete todos los campos requeridos')
      return
    }

    setSubiendo(true)
    try {
      const formData = new FormData()
      formData.append('file', archivo)
      formData.append('nombre', nombre)
      formData.append('codigo', codigo)
      formData.append('tipo', 'MEDIA_RES')
      formData.append('tipoImpresora', tipoImpresora)
      formData.append('ancho', String(ancho))
      formData.append('alto', String(alto))
      formData.append('dpi', String(dpi))
      formData.append('contenido', contenidoArchivo)
      formData.append('variables', JSON.stringify(variablesDetectadas))
      formData.append('categoria', categoriaUso)

      const response = await fetch('/api/rotulos/upload-plantilla', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        toast.success('Plantilla importada correctamente')
        setModalImportar(false)
        resetForm()
        cargarRotulos()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al subir plantilla')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al subir plantilla')
    } finally {
      setSubiendo(false)
    }
  }

  // Eliminar rótulo
  const handleEliminar = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este rótulo?')) return

    try {
      const response = await fetch(`/api/rotulos/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Rótulo eliminado')
        cargarRotulos()
      }
    } catch (error) {
      toast.error('Error al eliminar rótulo')
    }
  }

  // Toggle activo
  const handleToggleActivo = async (rotulo: Rotulo) => {
    try {
      const response = await fetch(`/api/rotulos/${rotulo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rotulo, activo: !rotulo.activo })
      })
      if (response.ok) {
        toast.success(rotulo.activo ? 'Rótulo desactivado' : 'Rótulo activado')
        cargarRotulos()
      }
    } catch (error) {
      toast.error('Error al cambiar estado')
    }
  }

  // Establecer como default para una categoría
  const handleSetDefault = async (rotulo: Rotulo) => {
    try {
      // Primero quitar default de otros de la misma categoría
      const rotulosMismaCategoria = rotulos.filter(
        r => r.categoria === rotulo.categoria && r.id !== rotulo.id && r.esDefault
      )
      
      for (const r of rotulosMismaCategoria) {
        await fetch(`/api/rotulos/${r.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...r, esDefault: false })
        })
      }
      
      // Luego establecer este como default
      const response = await fetch(`/api/rotulos/${rotulo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rotulo, esDefault: true })
      })
      
      if (response.ok) {
        toast.success('Rótulo establecido como predeterminado')
        cargarRotulos()
      }
    } catch (error) {
      toast.error('Error al establecer predeterminado')
    }
  }

  // Copiar contenido
  const handleCopiar = (contenido: string) => {
    navigator.clipboard.writeText(contenido)
    toast.success('Contenido copiado al portapapeles')
  }

  // Descargar archivo
  const handleDescargar = (rotulo: Rotulo) => {
    const blob = new Blob([rotulo.contenido], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const ext = rotulo.tipoImpresora === 'DATAMAX' ? 'dpl' : 'zpl'
    a.download = `${rotulo.nombre.replace(/\s+/g, '_')}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Reset formulario
  const resetForm = () => {
    setArchivo(null)
    setContenidoArchivo('')
    setVariablesDetectadas([])
    setNombre('')
    setCodigo('')
    setCategoriaUso('MEDIA_RES')
    setTipoImpresora('ZEBRA')
    setAncho(80)
    setAlto(50)
    setDpi(203)
    setVerContenido(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Agrupar rótulos por categoría
  const rotulosPorCategoria = rotulos.reduce((acc, rotulo) => {
    const cat = rotulo.categoria || 'SIN_CATEGORIA'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(rotulo)
    return acc
  }, {} as Record<string, Rotulo[]>)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 pt-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Tag className="w-6 h-6 text-amber-500" />
            Configuración de Rótulos
          </h2>
          <p className="text-sm text-stone-500">Plantillas para impresoras Zebra y Datamax</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => window.open('/VARIABLES_SOPORTADAS.txt', '_blank')}
          >
            <Variable className="w-4 h-4 mr-2" />
            Ver Variables
          </Button>
          <Button 
            onClick={() => setModalImportar(true)} 
            className="bg-amber-500 hover:bg-amber-600"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar Plantilla
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 mb-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5" />
              <div className="text-xs text-blue-700">
                <strong>Flujo de trabajo:</strong> Diseñe en Zebra Designer → Use variables como {'{{FECHA}}'}, {'{{TROPA}}'} → 
                Importe la plantilla → Asigne a una categoría → Al imprimir se reemplazan las variables automáticamente.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de rótulos por categoría */}
      <div className="flex-1 px-4 overflow-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        ) : rotulos.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <FileCode className="w-12 h-12 mx-auto text-stone-300 mb-3" />
              <p className="text-stone-500">No hay plantillas configuradas</p>
              <p className="text-xs text-stone-400 mt-1">Importe una plantilla para empezar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(rotulosPorCategoria).map(([categoria, rotulosCat]) => (
              <Card key={categoria} className="border-0 shadow-md">
                <CardHeader className="py-3 px-4 bg-stone-50 border-b">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {CATEGORIAS_USO.find(c => c.value === categoria)?.label || categoria}
                      <Badge variant="outline" className="font-normal">{rotulosCat.length}</Badge>
                    </span>
                    <span className="text-xs text-stone-400 font-normal">
                      {CATEGORIAS_USO.find(c => c.value === categoria)?.descripcion}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {rotulosCat.map((rotulo) => (
                      <div key={rotulo.id} className="p-3 hover:bg-stone-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge className={
                              rotulo.tipoImpresora === 'DATAMAX' 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-blue-100 text-blue-700'
                            }>
                              {rotulo.tipoImpresora === 'DATAMAX' ? 'DPL' : 'ZPL'}
                            </Badge>
                            <div>
                              <p className="font-medium flex items-center gap-2">
                                {rotulo.nombre}
                                {rotulo.esDefault && (
                                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                )}
                              </p>
                              <p className="text-xs text-stone-500">
                                {rotulo.codigo} • {rotulo.ancho}×{rotulo.alto}mm • {rotulo.dpi} DPI
                                {rotulo.nombreArchivo && ` • ${rotulo.nombreArchivo}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreview(rotulo)}
                              title="Vista previa con datos de prueba"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefault(rotulo)}
                              title="Establecer como predeterminado"
                              disabled={rotulo.esDefault}
                            >
                              <Star className={`w-4 h-4 ${rotulo.esDefault ? 'text-amber-500 fill-amber-500' : 'text-stone-300'}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopiar(rotulo.contenido)}
                              title="Copiar código"
                            >
                              <Copy className="w-4 h-4 text-stone-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDescargar(rotulo)}
                              title="Descargar archivo"
                            >
                              <Download className="w-4 h-4 text-stone-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActivo(rotulo)}
                              title={rotulo.activo ? 'Desactivar' : 'Activar'}
                            >
                              <Power className={`w-4 h-4 ${rotulo.activo ? 'text-green-500' : 'text-stone-300'}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEliminar(rotulo.id)}
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Variables detectadas */}
                        {rotulo.variables && JSON.parse(rotulo.variables).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {JSON.parse(rotulo.variables).slice(0, 8).map((v: VariableDetectada, i: number) => (
                              <code key={i} className="text-xs bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">
                                {v.variable}
                              </code>
                            ))}
                            {JSON.parse(rotulo.variables).length > 8 && (
                              <span className="text-xs text-stone-400">
                                +{JSON.parse(rotulo.variables).length - 8} más
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal Importar */}
      <Dialog open={modalImportar} onOpenChange={(open) => {
        setModalImportar(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-amber-500" />
              Importar Plantilla
            </DialogTitle>
            <DialogDescription>
              Importe plantillas desde Zebra Designer o Datamax Designer
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Archivo */}
            <div>
              <Label>Archivo de Plantilla</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".zpl,.prn,.nlbl,.lbl,.dpl,.txt"
                onChange={handleFileSelect}
                className="mt-1"
              />
              <p className="text-xs text-stone-500 mt-1">
                Zebra: .zpl, .prn, .nlbl, .lbl | Datamax: .dpl
              </p>
            </div>

            {/* Nombre y código */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nombre</Label>
                <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </div>
              <div>
                <Label>Código</Label>
                <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} />
              </div>
            </div>

            {/* Categoría de uso */}
            <div>
              <Label>Categoría de Uso</Label>
              <Select value={categoriaUso} onValueChange={setCategoriaUso}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_USO.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      <div>
                        <span>{c.label}</span>
                        <span className="text-xs text-stone-400 ml-2">{c.descripcion}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dimensiones */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Ancho (mm)</Label>
                <Input type="number" value={ancho} onChange={(e) => setAncho(parseInt(e.target.value) || 80)} />
              </div>
              <div>
                <Label>Alto (mm)</Label>
                <Input type="number" value={alto} onChange={(e) => setAlto(parseInt(e.target.value) || 50)} />
              </div>
              <div>
                <Label>DPI</Label>
                <Select value={String(dpi)} onValueChange={(v) => setDpi(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="203">203 DPI</SelectItem>
                    <SelectItem value="300">300 DPI</SelectItem>
                    <SelectItem value="600">600 DPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Variables detectadas */}
            {variablesDetectadas.length > 0 && (
              <div>
                <Label className="flex items-center gap-2">
                  <Variable className="w-4 h-4" />
                  Variables Detectadas ({variablesDetectadas.length})
                </Label>
                <div className="mt-2 flex flex-wrap gap-1 p-2 bg-stone-50 rounded-md max-h-24 overflow-auto">
                  {variablesDetectadas.map((v, i) => (
                    <div key={i} className="flex items-center gap-1 text-xs bg-white px-2 py-1 rounded border">
                      <code className="text-blue-600">{v.variable}</code>
                      <span className="text-stone-400">→</span>
                      <span className="text-stone-600">{v.descripcion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ver contenido (colapsable) */}
            {contenidoArchivo && (
              <Collapsible open={verContenido} onOpenChange={setVerContenido}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 w-full justify-start">
                  {verContenido ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  Ver código de la plantilla
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ScrollArea className="h-40 mt-2 border rounded-md bg-stone-900">
                    <pre className="p-3 text-xs text-green-400 font-mono whitespace-pre-wrap">
                      {contenidoArchivo}
                    </pre>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setModalImportar(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubir} 
              disabled={subiendo || !archivo}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {subiendo ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Importar Plantilla
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Preview */}
      <Dialog open={modalPreview} onOpenChange={setModalPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-500" />
              Vista Previa: {rotuloSeleccionado?.nombre}
            </DialogTitle>
            <DialogDescription>
              Previsualización con datos de prueba • {rotuloSeleccionado?.ancho}×{rotuloSeleccionado?.alto}mm
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            {/* Panel izquierdo - Datos de prueba */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Variable className="w-4 h-4" />
                Datos de Prueba
              </Label>
              <ScrollArea className="h-[300px] border rounded-md p-3 bg-stone-50">
                <div className="space-y-2">
                  {Object.entries(datosPrueba).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <code className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs min-w-[100px]">
                        {`{{${key}}}`}
                      </code>
                      <span className="text-stone-400">→</span>
                      <span className="text-stone-700 font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs text-amber-700">
                  <strong>Nota:</strong> Los datos de prueba se reemplazarán por valores reales 
                  al imprimir desde los módulos de producción (Romaneo, Pesaje, etc.)
                </p>
              </div>
            </div>

            {/* Panel derecho - ZPL Procesado */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  ZPL Procesado
                </Label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(previewProcesado)
                      toast.success('ZPL copiado al portapapeles')
                    }}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copiar
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-[300px] border rounded-md bg-stone-900">
                <pre className="p-3 text-xs text-green-400 font-mono whitespace-pre-wrap">
                  {previewProcesado}
                </pre>
              </ScrollArea>
              
              {/* Acciones */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const blob = new Blob([previewProcesado], { type: 'text/plain' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `preview_${rotuloSeleccionado?.nombre || 'rotulo'}.zpl`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar ZPL
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleImprimirPrueba}
                  disabled={imprimiendo}
                >
                  {imprimiendo ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Imprimiendo...
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4 mr-2" />
                      Imprimir Prueba
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setModalPreview(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
