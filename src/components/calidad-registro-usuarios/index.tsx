'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Users, FileText, Plus, Save, X, Loader2, Search, 
  Calendar, AlertCircle, CheckCircle, AlertTriangle, 
  ChevronRight, Filter, MessageSquare, Send,
  Clock, Phone, Mail, User, Upload, Download, 
  Image, File, Eye, Trash2, Lock, Paperclip
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { TextoEditable, EditableBlock, useEditor } from '@/components/ui/editable-screen'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

const TIPOS_RECLAMO = [
  { id: 'RECLAMO', label: 'Reclamo', color: 'bg-red-100 text-red-700' },
  { id: 'QUEJA', label: 'Queja', color: 'bg-orange-100 text-orange-700' },
  { id: 'INCIDENTE', label: 'Incidente', color: 'bg-purple-100 text-purple-700' },
  { id: 'CONSULTA', label: 'Consulta', color: 'bg-blue-100 text-blue-700' },
  { id: 'SUGERENCIA', label: 'Sugerencia', color: 'bg-green-100 text-green-700' },
  { id: 'OTRO', label: 'Otro', color: 'bg-stone-100 text-stone-700' },
]

const ESTADOS_RECLAMO = [
  { id: 'PENDIENTE', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'EN_REVISION', label: 'En Revisión', color: 'bg-blue-100 text-blue-700' },
  { id: 'RESPONDIDO', label: 'Respondido', color: 'bg-cyan-100 text-cyan-700' },
  { id: 'RESUELTO', label: 'Resuelto', color: 'bg-green-100 text-green-700' },
  { id: 'CERRADO', label: 'Cerrado', color: 'bg-stone-100 text-stone-700' },
  { id: 'ANULADO', label: 'Anulado', color: 'bg-red-100 text-red-700' },
]

const PRIORIDADES = [
  { id: 'BAJA', label: 'Baja', color: 'bg-stone-100 text-stone-600' },
  { id: 'NORMAL', label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  { id: 'ALTA', label: 'Alta', color: 'bg-orange-100 text-orange-700' },
  { id: 'URGENTE', label: 'Urgente', color: 'bg-red-100 text-red-700' },
]

const TIPOS_RESPUESTA = [
  { id: 'RESPUESTA_CLIENTE', label: 'Respuesta al Cliente', color: 'bg-green-100 text-green-700', icon: Send },
  { id: 'NOTA_INTERNA', label: 'Nota Interna (Supervisores)', color: 'bg-amber-100 text-amber-700', icon: Lock },
  { id: 'SEGUIMIENTO', label: 'Seguimiento', color: 'bg-blue-100 text-blue-700', icon: Clock },
  { id: 'CIERRE', label: 'Cierre/Resolución', color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
]

interface Archivo {
  id: string
  nombre: string
  tipo: string
  mimeType: string | null
  tamaño: number
  descripcion: string | null
  fechaSubida: string
  subidoPor: string | null
  contenido?: string // Base64 para archivos nuevos
}

interface Respuesta {
  id: string
  mensaje: string
  tipo: string
  autorNombre: string | null
  fecha: string
  archivos: Archivo[]
}

interface Reclamo {
  id: string
  clienteId: string
  tipo: string
  titulo: string
  descripcion: string | null
  fecha: string
  tropaCodigo: string | null
  registradoPor: string | null
  estado: string
  prioridad: string
  respuesta: string | null
  fechaRespuesta: string | null
  respondidoPor: string | null
  fechaResolucion: string | null
  resueltoPor: string | null
  resultado: string | null
  seguimiento: string | null
  observaciones: string | null
  cliente?: {
    id: string
    nombre: string
    cuit: string | null
    telefono: string | null
    email: string | null
  }
  respuestas?: Respuesta[]
  archivos?: Archivo[]
  _count?: {
    respuestas: number
    archivos: number
  }
}

interface Cliente {
  id: string
  nombre: string
  cuit: string | null
  telefono: string | null
  email: string | null
  esUsuarioFaena: boolean
  _count?: {
    reclamosPendientes: number
    totalReclamos: number
  }
}

interface Operador {
  id: string
  nombre: string
  rol: string
}

interface Props {
  operador: Operador
}

export function CalidadRegistroUsuariosModule({ operador }: Props) {
  const { editMode, getTexto } = useEditor()
  const [loading, setLoading] = useState(true)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [reclamosPendientes, setReclamosPendientes] = useState<Reclamo[]>([])
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [reclamosCliente, setReclamosCliente] = useState<Reclamo[]>([])
  
  // Filtros
  const [filtroTipo, setFiltroTipo] = useState('TODOS')
  const [filtroEstado, setFiltroEstado] = useState('TODOS')
  const [busqueda, setBusqueda] = useState('')
  
  // Dialogs
  const [dialogReclamoOpen, setDialogReclamoOpen] = useState(false)
  const [dialogRespuestaOpen, setDialogRespuestaOpen] = useState(false)
  const [dialogDetalleOpen, setDialogDetalleOpen] = useState(false)
  const [detalleClienteOpen, setDetalleClienteOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Forms
  const [reclamoForm, setReclamoForm] = useState({
    clienteId: '', tipo: 'RECLAMO', titulo: '', descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    tropaCodigo: '', prioridad: 'NORMAL', observaciones: ''
  })
  
  const [respuestaForm, setRespuestaForm] = useState({
    mensaje: '',
    tipo: 'RESPUESTA_CLIENTE',
    resultado: ''
  })
  
  const [selectedReclamo, setSelectedReclamo] = useState<Reclamo | null>(null)
  const [archivosNuevos, setArchivosNuevos] = useState<Archivo[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Verificar si es supervisor
  const esSupervisor = operador.rol === 'SUPERVISOR' || operador.rol === 'ADMINISTRADOR'

  useEffect(() => {
    fetchClientes()
    fetchReclamosPendientes()
  }, [])

  const fetchClientes = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/clientes?esUsuarioFaena=true')
      const data = await res.json()
      if (data.success) {
        const clientesConStats = await Promise.all(
          data.data.map(async (cliente: Cliente) => {
            const resReclamos = await fetch(`/api/calidad-reclamos?clienteId=${cliente.id}`)
            const dataReclamos = await resReclamos.json()
            if (dataReclamos.success) {
              const reclamos = dataReclamos.data
              return {
                ...cliente,
                _count: {
                  reclamosPendientes: reclamos.filter((r: Reclamo) => 
                    r.estado === 'PENDIENTE' || r.estado === 'EN_REVISION'
                  ).length,
                  totalReclamos: reclamos.length
                }
              }
            }
            return cliente
          })
        )
        setClientes(clientesConStats)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  const fetchReclamosPendientes = async () => {
    try {
      const res = await fetch('/api/calidad-reclamos?pendientes=true')
      const data = await res.json()
      if (data.success) {
        setReclamosPendientes(data.data)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchReclamosCliente = async (clienteId: string) => {
    try {
      const res = await fetch(`/api/calidad-reclamos?clienteId=${clienteId}`)
      const data = await res.json()
      if (data.success) {
        setReclamosCliente(data.data)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchReclamoDetalle = async (id: string) => {
    try {
      const res = await fetch(`/api/calidad-reclamos?id=${id}`)
      const data = await res.json()
      if (data.success) {
        setSelectedReclamo(data.data)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleSelectCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    fetchReclamosCliente(cliente.id)
    setDetalleClienteOpen(true)
  }

  const handleNuevoReclamo = (clienteId: string) => {
    setReclamoForm({
      clienteId,
      tipo: 'RECLAMO',
      titulo: '',
      descripcion: '',
      fecha: new Date().toISOString().split('T')[0],
      tropaCodigo: '',
      prioridad: 'NORMAL',
      observaciones: ''
    })
    setArchivosNuevos([])
    setDialogReclamoOpen(true)
  }

  const handleVerDetalle = async (reclamo: Reclamo) => {
    await fetchReclamoDetalle(reclamo.id)
    setDialogDetalleOpen(true)
  }

  // Manejo de archivos
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    for (const file of Array.from(files)) {
      // Verificar tipo (solo imágenes y PDFs)
      const isImage = file.type.startsWith('image/')
      const isPdf = file.type === 'application/pdf'
      
      if (!isImage && !isPdf) {
        toast.error(`${file.name}: Solo se permiten imágenes y PDFs`)
        continue
      }

      // Leer archivo como base64
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        const contenido = base64.split(',')[1] // Remover data:xxx;base64,
        
        const nuevoArchivo: Archivo = {
          id: `temp-${Date.now()}-${Math.random()}`,
          nombre: file.name,
          tipo: isImage ? 'FOTO' : 'PDF',
          mimeType: file.type,
          tamaño: file.size,
          descripcion: null,
          fechaSubida: new Date().toISOString(),
          subidoPor: operador.nombre,
          contenido: contenido
        }
        setArchivosNuevos(prev => [...prev, nuevoArchivo])
      }
      reader.readAsDataURL(file)
    }
    
    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveArchivo = (id: string) => {
    setArchivosNuevos(prev => prev.filter(a => a.id !== id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleGuardarReclamo = async () => {
    if (!reclamoForm.titulo) {
      toast.error('Complete el título del reclamo')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/api/calidad-reclamos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reclamoForm,
          registradoPor: operador.nombre,
          archivos: archivosNuevos
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Reclamo registrado correctamente')
        setDialogReclamoOpen(false)
        setArchivosNuevos([])
        if (selectedCliente) {
          fetchReclamosCliente(selectedCliente.id)
        }
        fetchReclamosPendientes()
        fetchClientes()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleResponderReclamo = async (reclamo: Reclamo) => {
    await fetchReclamoDetalle(reclamo.id)
    setRespuestaForm({
      mensaje: '',
      tipo: 'RESPUESTA_CLIENTE',
      resultado: ''
    })
    setArchivosNuevos([])
    setDialogRespuestaOpen(true)
  }

  const handleGuardarRespuesta = async () => {
    if (!respuestaForm.mensaje) {
      toast.error('Ingrese el mensaje')
      return
    }

    // Si es nota interna, verificar que sea supervisor
    if (respuestaForm.tipo === 'NOTA_INTERNA' && !esSupervisor) {
      toast.error('Solo supervisores pueden agregar notas internas')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/api/calidad-reclamos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedReclamo?.id,
          nuevaRespuesta: {
            mensaje: respuestaForm.mensaje,
            tipo: respuestaForm.tipo,
            autorId: operador.id,
            autorNombre: operador.nombre,
            resultado: respuestaForm.resultado,
            archivos: archivosNuevos
          }
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Respuesta guardada correctamente')
        setDialogRespuestaOpen(false)
        setArchivosNuevos([])
        if (selectedCliente) {
          fetchReclamosCliente(selectedCliente.id)
        }
        fetchReclamosPendientes()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleCambiarEstado = async (reclamo: Reclamo, nuevoEstado: string) => {
    try {
      const res = await fetch('/api/calidad-reclamos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reclamo.id,
          estado: nuevoEstado,
          resueltoPor: nuevoEstado === 'RESUELTO' ? operador.nombre : undefined
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Estado actualizado')
        if (selectedCliente) {
          fetchReclamosCliente(selectedCliente.id)
        }
        fetchReclamosPendientes()
      }
    } catch (error) {
      toast.error('Error al actualizar')
    }
  }

  const handleDescargarArchivo = (archivo: Archivo) => {
    if (!archivo.contenido) return
    
    const mimeType = archivo.mimeType || 'application/octet-stream'
    const byteCharacters = atob(archivo.contenido)
    const byteArrays = []
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512)
      const byteNumbers = new Array(slice.length)
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      byteArrays.push(byteArray)
    }
    
    const blob = new Blob(byteArrays, { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = archivo.nombre
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getTipoBadge = (tipo: string) => {
    const tipoInfo = TIPOS_RECLAMO.find(t => t.id === tipo)
    return (
      <Badge variant="outline" className={tipoInfo?.color || 'bg-gray-100'}>
        {tipoInfo?.label || tipo}
      </Badge>
    )
  }

  const getEstadoBadge = (estado: string) => {
    const estadoInfo = ESTADOS_RECLAMO.find(e => e.id === estado)
    return (
      <Badge variant="outline" className={estadoInfo?.color || 'bg-gray-100'}>
        {estadoInfo?.label || estado}
      </Badge>
    )
  }

  const getPrioridadBadge = (prioridad: string) => {
    const prioridadInfo = PRIORIDADES.find(p => p.id === prioridad)
    return (
      <Badge variant="outline" className={prioridadInfo?.color || 'bg-gray-100'}>
        {prioridadInfo?.label || prioridad}
      </Badge>
    )
  }

  const getTipoRespuestaBadge = (tipo: string) => {
    const tipoInfo = TIPOS_RESPUESTA.find(t => t.id === tipo)
    return (
      <Badge variant="outline" className={tipoInfo?.color || 'bg-gray-100'}>
        {tipoInfo?.label || tipo}
      </Badge>
    )
  }

  const stats = {
    totalClientes: clientes.length,
    totalReclamos: clientes.reduce((acc, c) => acc + (c._count?.totalReclamos || 0), 0),
    pendientes: reclamosPendientes.length,
    urgentes: reclamosPendientes.filter(r => r.prioridad === 'URGENTE' || r.prioridad === 'ALTA').length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <EditableBlock bloqueId="header" label="Encabezado">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-stone-800 flex items-center gap-2">
                <Users className="w-8 h-8 text-amber-500" />
                <TextoEditable id="calidad-titulo" original="Control de Calidad - Reclamos de Clientes" tag="span" />
              </h1>
              <p className="text-stone-500">
                <TextoEditable id="calidad-subtitulo" original="Registro de reclamos, quejas e incidentes de usuarios de faena" tag="span" />
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { fetchClientes(); fetchReclamosPendientes(); }}>
                <Clock className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </div>
        </EditableBlock>

        {/* Stats Cards */}
        <EditableBlock bloqueId="stats" label="Estadísticas">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-stone-100 p-2 rounded-lg">
                    <Users className="w-5 h-5 text-stone-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Usuarios de Faena</p>
                    <p className="text-xl font-bold">{stats.totalClientes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Total Reclamos</p>
                    <p className="text-xl font-bold">{stats.totalReclamos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Pendientes</p>
                    <p className="text-xl font-bold text-yellow-600">{stats.pendientes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Urgentes/Altos</p>
                    <p className="text-xl font-bold text-red-600">{stats.urgentes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </EditableBlock>

        {/* Main Content */}
        <Tabs defaultValue="pendientes" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pendientes">
              Pendientes
              {reclamosPendientes.length > 0 && (
                <Badge className="ml-2 bg-red-500 text-white">{reclamosPendientes.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          {/* Tab: Pendientes */}
          <TabsContent value="pendientes">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Reclamos Pendientes de Atención
                </CardTitle>
                <CardDescription>
                  Reclamos que requieren respuesta o resolución
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {reclamosPendientes.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p>No hay reclamos pendientes</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-stone-50/50">
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Prioridad</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="w-40"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reclamosPendientes.map((reclamo) => (
                        <TableRow key={reclamo.id}>
                          <TableCell>{new Date(reclamo.fecha).toLocaleDateString('es-AR')}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{reclamo.cliente?.nombre || '-'}</p>
                              <p className="text-xs text-stone-400">{reclamo.cliente?.cuit || ''}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getTipoBadge(reclamo.tipo)}</TableCell>
                          <TableCell className="font-medium max-w-xs truncate">{reclamo.titulo}</TableCell>
                          <TableCell>{getPrioridadBadge(reclamo.prioridad)}</TableCell>
                          <TableCell>{getEstadoBadge(reclamo.estado)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleVerDetalle(reclamo)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => handleResponderReclamo(reclamo)}
                                className="bg-amber-500 hover:bg-amber-600"
                              >
                                <Send className="w-4 h-4 mr-1" />
                                Responder
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Clientes */}
          <TabsContent value="clientes">
            <Card className="border-0 shadow-md mb-4">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label className="text-xs">Buscar</Label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <Input
                        className="pl-9"
                        placeholder="Nombre, CUIT..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button onClick={fetchClientes} className="self-end bg-amber-500 hover:bg-amber-600">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtrar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle className="text-lg">
                  Usuarios de Faena ({clientes.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
                  </div>
                ) : clientes.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay usuarios de faena registrados</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-stone-50/50">
                        <TableHead>Nombre</TableHead>
                        <TableHead>CUIT</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Reclamos</TableHead>
                        <TableHead>Pendientes</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientes.map((cliente) => (
                        <TableRow 
                          key={cliente.id}
                          className="cursor-pointer hover:bg-stone-50"
                          onClick={() => handleSelectCliente(cliente)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-stone-400" />
                              <span className="font-medium">{cliente.nombre}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{cliente.cuit || '-'}</TableCell>
                          <TableCell>{cliente.telefono || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{cliente._count?.totalReclamos || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            {cliente._count?.reclamosPendientes ? (
                              <Badge className="bg-red-100 text-red-700">
                                {cliente._count.reclamosPendientes} pend.
                              </Badge>
                            ) : (
                              <span className="text-stone-400">0</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <ChevronRight className="w-4 h-4 text-stone-400" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Historial */}
          <TabsContent value="historial">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle className="text-lg">Historial de Reclamos</CardTitle>
                <CardDescription>Seleccione un cliente para ver su historial completo</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-8 text-center text-stone-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Seleccione un cliente de la pestaña Clientes para ver su historial</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog: Detalle Cliente */}
        <Dialog open={detalleClienteOpen} onOpenChange={setDetalleClienteOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-amber-500" />
                Historial del Cliente
              </DialogTitle>
            </DialogHeader>
            
            {selectedCliente && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-lg">{selectedCliente.nombre}</h4>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">Usuario de Faena</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <Button onClick={() => handleNuevoReclamo(selectedCliente.id)} className="bg-amber-500 hover:bg-amber-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo Reclamo
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-stone-400" />
                    <span className="text-stone-500">CUIT:</span>
                    <span className="font-medium">{selectedCliente.cuit || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-stone-400" />
                    <span className="text-stone-500">Tel:</span>
                    <span className="font-medium">{selectedCliente.telefono || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-stone-400" />
                    <span className="text-stone-500">Email:</span>
                    <span className="font-medium">{selectedCliente.email || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-stone-500">Reclamos:</span>
                    <span className="font-medium">{selectedCliente._count?.totalReclamos || 0}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500" />
                    Historial de Reclamos
                  </h4>
                  {reclamosCliente.length === 0 ? (
                    <div className="p-4 text-center text-stone-400 bg-stone-50 rounded-lg">
                      Sin reclamos registrados
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {reclamosCliente.map((reclamo) => (
                        <div key={reclamo.id} className="p-3 bg-stone-50 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getTipoBadge(reclamo.tipo)}
                                {getEstadoBadge(reclamo.estado)}
                                {getPrioridadBadge(reclamo.prioridad)}
                                <span className="text-xs text-stone-400">
                                  {new Date(reclamo.fecha).toLocaleDateString('es-AR')}
                                </span>
                              </div>
                              <p className="font-medium">{reclamo.titulo}</p>
                              {reclamo.descripcion && (
                                <p className="text-sm text-stone-500 mt-1">{reclamo.descripcion}</p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleVerDetalle(reclamo)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {(reclamo.estado === 'PENDIENTE' || reclamo.estado === 'EN_REVISION') && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleResponderReclamo(reclamo)}
                                  className="text-amber-600"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetalleClienteOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Nuevo Reclamo */}
        <Dialog open={dialogReclamoOpen} onOpenChange={setDialogReclamoOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Reclamo/Queja</DialogTitle>
              <DialogDescription>Registrar un nuevo reclamo para el cliente</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select value={reclamoForm.tipo} onValueChange={(v) => setReclamoForm({...reclamoForm, tipo: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPOS_RECLAMO.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Select value={reclamoForm.prioridad} onValueChange={(v) => setReclamoForm({...reclamoForm, prioridad: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORIDADES.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Título *</Label>
                <Input value={reclamoForm.titulo} onChange={(e) => setReclamoForm({...reclamoForm, titulo: e.target.value})} placeholder="Título del reclamo" />
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea 
                  value={reclamoForm.descripcion} 
                  onChange={(e) => setReclamoForm({...reclamoForm, descripcion: e.target.value})} 
                  placeholder="Detalle del reclamo..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input type="date" value={reclamoForm.fecha} onChange={(e) => setReclamoForm({...reclamoForm, fecha: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Tropa (opcional)</Label>
                  <Input value={reclamoForm.tropaCodigo} onChange={(e) => setReclamoForm({...reclamoForm, tropaCodigo: e.target.value})} placeholder="Código de tropa" />
                </div>
              </div>

              {/* Archivos adjuntos */}
              <div className="space-y-2">
                <Label>Archivos Adjuntos (Fotos, PDFs)</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,.pdf"
                  multiple
                  className="hidden"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Seleccionar Archivos
                </Button>
                
                {archivosNuevos.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {archivosNuevos.map((archivo) => (
                      <div key={archivo.id} className="flex items-center justify-between p-2 bg-stone-50 rounded">
                        <div className="flex items-center gap-2">
                          {archivo.tipo === 'FOTO' ? (
                            <Image className="w-4 h-4 text-blue-500" />
                          ) : (
                            <File className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-sm truncate max-w-[200px]">{archivo.nombre}</span>
                          <span className="text-xs text-stone-400">({formatFileSize(archivo.tamaño)})</span>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveArchivo(archivo.id)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea 
                  value={reclamoForm.observaciones} 
                  onChange={(e) => setReclamoForm({...reclamoForm, observaciones: e.target.value})} 
                  placeholder="Observaciones internas..."
                  rows={2}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogReclamoOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGuardarReclamo} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Responder Reclamo */}
        <Dialog open={dialogRespuestaOpen} onOpenChange={setDialogRespuestaOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Responder Reclamo</DialogTitle>
              {selectedReclamo && (
                <DialogDescription>
                  {selectedReclamo.cliente?.nombre} - {selectedReclamo.titulo}
                </DialogDescription>
              )}
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Info del reclamo original */}
              {selectedReclamo && (
                <div className="p-3 bg-stone-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {getTipoBadge(selectedReclamo.tipo)}
                    {getEstadoBadge(selectedReclamo.estado)}
                    {getPrioridadBadge(selectedReclamo.prioridad)}
                  </div>
                  {selectedReclamo.descripcion && (
                    <p className="text-sm text-stone-600">{selectedReclamo.descripcion}</p>
                  )}
                  
                  {/* Archivos del reclamo */}
                  {selectedReclamo.archivos && selectedReclamo.archivos.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs text-stone-500 mb-1">Archivos adjuntos:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedReclamo.archivos.map((archivo) => (
                          <Button 
                            key={archivo.id}
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDescargarArchivo(archivo)}
                          >
                            {archivo.tipo === 'FOTO' ? (
                              <Image className="w-3 h-3 mr-1" />
                            ) : (
                              <File className="w-3 h-3 mr-1" />
                            )}
                            {archivo.nombre}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Historial de respuestas */}
              {selectedReclamo?.respuestas && selectedReclamo.respuestas.length > 0 && (
                <div className="space-y-2">
                  <Label>Historial de Respuestas</Label>
                  <ScrollArea className="h-40 border rounded-lg p-2">
                    {selectedReclamo.respuestas.map((resp) => (
                      <div 
                        key={resp.id} 
                        className={`p-2 mb-2 rounded ${resp.tipo === 'NOTA_INTERNA' ? 'bg-amber-50' : 'bg-green-50'}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {getTipoRespuestaBadge(resp.tipo)}
                          <span className="text-xs text-stone-400">
                            {new Date(resp.fecha).toLocaleString('es-AR')}
                          </span>
                          {resp.autorNombre && (
                            <span className="text-xs text-stone-500">por {resp.autorNombre}</span>
                          )}
                        </div>
                        <p className="text-sm">{resp.mensaje}</p>
                        {resp.archivos && resp.archivos.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {resp.archivos.map((a) => (
                              <Button key={a.id} size="sm" variant="ghost" className="h-6 text-xs">
                                <Paperclip className="w-3 h-3 mr-1" />
                                {a.nombre}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}

              <Separator />

              {/* Nueva respuesta */}
              <div className="space-y-2">
                <Label>Tipo de Respuesta</Label>
                <Select value={respuestaForm.tipo} onValueChange={(v) => setRespuestaForm({...respuestaForm, tipo: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_RESPUESTA.filter(t => t.id !== 'NOTA_INTERNA' || esSupervisor).map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <t.icon className="w-4 h-4" />
                          {t.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {respuestaForm.tipo === 'NOTA_INTERNA' && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Solo visible para supervisores
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Mensaje *</Label>
                <Textarea 
                  value={respuestaForm.mensaje} 
                  onChange={(e) => setRespuestaForm({...respuestaForm, mensaje: e.target.value})} 
                  placeholder="Escriba su respuesta..."
                  rows={4}
                />
              </div>

              {/* Archivos para la respuesta */}
              <div className="space-y-2">
                <Label>Archivos Adjuntos (opcional)</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,.pdf"
                  multiple
                  className="hidden"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Adjuntar Archivos
                </Button>
                
                {archivosNuevos.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {archivosNuevos.map((archivo) => (
                      <div key={archivo.id} className="flex items-center justify-between p-2 bg-stone-50 rounded">
                        <div className="flex items-center gap-2">
                          {archivo.tipo === 'FOTO' ? (
                            <Image className="w-4 h-4 text-blue-500" />
                          ) : (
                            <File className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-sm truncate max-w-[200px]">{archivo.nombre}</span>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleRemoveArchivo(archivo.id)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {respuestaForm.tipo === 'CIERRE' && (
                <div className="space-y-2">
                  <Label>Resultado</Label>
                  <Select value={respuestaForm.resultado} onValueChange={(v) => setRespuestaForm({...respuestaForm, resultado: v})}>
                    <SelectTrigger><SelectValue placeholder="Seleccione resultado..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FAVORABLE">Favorable al cliente</SelectItem>
                      <SelectItem value="PARCIAL">Parcialmente favorable</SelectItem>
                      <SelectItem value="DESESTIMADO">Desestimado</SelectItem>
                      <SelectItem value="ACLARADO">Aclarado sin acción</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogRespuestaOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGuardarRespuesta} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Guardar Respuesta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Ver Detalle Completo */}
        <Dialog open={dialogDetalleOpen} onOpenChange={setDialogDetalleOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalle del Reclamo</DialogTitle>
            </DialogHeader>
            
            {selectedReclamo && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-stone-500">Cliente</p>
                    <p className="font-medium">{selectedReclamo.cliente?.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-stone-500">Fecha</p>
                    <p className="font-medium">{new Date(selectedReclamo.fecha).toLocaleDateString('es-AR')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getTipoBadge(selectedReclamo.tipo)}
                  {getEstadoBadge(selectedReclamo.estado)}
                  {getPrioridadBadge(selectedReclamo.prioridad)}
                </div>

                <div>
                  <p className="text-sm text-stone-500">Título</p>
                  <p className="font-medium">{selectedReclamo.titulo}</p>
                </div>

                {selectedReclamo.descripcion && (
                  <div>
                    <p className="text-sm text-stone-500">Descripción</p>
                    <p className="text-stone-700">{selectedReclamo.descripcion}</p>
                  </div>
                )}

                {/* Archivos del reclamo */}
                {selectedReclamo.archivos && selectedReclamo.archivos.length > 0 && (
                  <div>
                    <p className="text-sm text-stone-500 mb-2">Archivos Adjuntos</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedReclamo.archivos.map((archivo) => (
                        <Button 
                          key={archivo.id}
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDescargarArchivo(archivo)}
                        >
                          {archivo.tipo === 'FOTO' ? (
                            <Image className="w-4 h-4 mr-2" />
                          ) : (
                            <File className="w-4 h-4 mr-2" />
                          )}
                          {archivo.nombre}
                          <span className="text-xs text-stone-400 ml-2">
                            ({formatFileSize(archivo.tamaño)})
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Historial de respuestas */}
                {selectedReclamo.respuestas && selectedReclamo.respuestas.length > 0 && (
                  <div>
                    <p className="text-sm text-stone-500 mb-2">Historial de Respuestas ({selectedReclamo.respuestas.length})</p>
                    <ScrollArea className="h-60 border rounded-lg">
                      <div className="p-2 space-y-2">
                        {selectedReclamo.respuestas.map((resp) => (
                          <div 
                            key={resp.id} 
                            className={`p-3 rounded ${
                              resp.tipo === 'NOTA_INTERNA' 
                                ? 'bg-amber-50 border border-amber-200' 
                                : resp.tipo === 'CIERRE'
                                ? 'bg-purple-50 border border-purple-200'
                                : 'bg-green-50 border border-green-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {getTipoRespuestaBadge(resp.tipo)}
                              <span className="text-xs text-stone-400">
                                {new Date(resp.fecha).toLocaleString('es-AR')}
                              </span>
                              {resp.autorNombre && (
                                <span className="text-xs text-stone-500">por {resp.autorNombre}</span>
                              )}
                            </div>
                            <p className="text-sm text-stone-700">{resp.mensaje}</p>
                            {resp.archivos && resp.archivos.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {resp.archivos.map((a) => (
                                  <Button 
                                    key={a.id} 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-6 text-xs"
                                    onClick={() => handleDescargarArchivo(a)}
                                  >
                                    <Paperclip className="w-3 h-3 mr-1" />
                                    {a.nombre}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                <Separator />

                {/* Acciones */}
                <div className="flex gap-2 justify-end">
                  {(selectedReclamo.estado === 'PENDIENTE' || selectedReclamo.estado === 'EN_REVISION') && (
                    <Button onClick={() => { setDialogDetalleOpen(false); handleResponderReclamo(selectedReclamo); }} className="bg-amber-500 hover:bg-amber-600">
                      <Send className="w-4 h-4 mr-2" />
                      Agregar Respuesta
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setDialogDetalleOpen(false)}>
                    Cerrar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
