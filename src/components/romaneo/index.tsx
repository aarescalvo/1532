'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Scale, Printer, RefreshCw, User, Warehouse, ChevronUp, ChevronDown,
  CheckCircle, AlertTriangle, RotateCcw, Trash2, AlertOctagon,
  Edit3, Save, X, Move, Settings2, Eye, Type, Palette
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const DIENTES = ['0', '2', '4', '6', '8']
const SIGLAS = ['A', 'T', 'D']

// ==================== TIPOS ====================
interface Tipificador {
  id: string
  nombre: string
  apellido: string
  matricula: string
}

interface Camara {
  id: string
  nombre: string
  tipo: string
  capacidad: number
}

interface MediaPesada {
  id: string
  garron: number
  lado: string
  peso: number
  siglas: string[]
  fecha: Date
  tropaCodigo: string | null
  tipoAnimal: string | null
  decomisada?: boolean
  kgDecomiso?: number
  kgRestantes?: number
}

interface AsignacionGarron {
  garron: number
  animalId: string | null
  animalCodigo: string | null
  tropaCodigo: string | null
  tipoAnimal: string | null
  pesoVivo: number | null
  tieneMediaDer: boolean
  tieneMediaIzq: boolean
}

interface Operador {
  id: string
  nombre: string
  nivel: string
  rol?: string
  permisos?: Record<string, boolean>
}

// ==================== SISTEMA DE LAYOUT COMPLETO ====================
interface BloqueLayout {
  id: string
  label: string
  visible: boolean
  x: number
  y: number
  width: number
  height: number
  minWidth: number
  minHeight: number
  titulo?: string
  subtitulo?: string
}

interface BotonConfig {
  id: string
  texto: string
  visible: boolean
  color: string
}

interface TextosConfig {
  tituloModulo: string
  subtituloModulo: string
  labelTipificador: string
  labelCamara: string
  labelMedias: string
  labelPesajeActual: string
  labelTropa: string
  labelTipo: string
  labelPVivo: string
  labelEstado: string
  labelPesoKg: string
  labelDenticion: string
  labelGarrones: string
  labelTotal: string
  msgFaltaIzq: string
  msgFaltaDer: string
  msgNoHayAnimal: string
  msgNoHayGarrones: string
  msgTodosAsignados: string
  btnDerecha: string
  btnIzquierda: string
  btnAceptar: string
  btnDecomiso: string
  btnEliminar: string
  btnReimprimir: string
  btnConfigurar: string
  btnActualizar: string
}

// Valores por defecto
const LAYOUT_DEFAULT: BloqueLayout[] = [
  { id: 'header', label: 'Encabezado', visible: true, x: 20, y: 20, width: 900, height: 70, minWidth: 300, minHeight: 60, titulo: 'Romaneo - Pesaje de Medias', subtitulo: 'Pesaje y rotulado de medias reses' },
  { id: 'configuracion', label: 'Configuración', visible: true, x: 20, y: 100, width: 900, height: 60, minWidth: 200, minHeight: 50 },
  { id: 'panelPesaje', label: 'Panel de Pesaje', visible: true, x: 20, y: 180, width: 600, height: 520, minWidth: 400, minHeight: 400, titulo: 'Pesaje Actual' },
  { id: 'historialMedias', label: 'Listado de Garrones', visible: true, x: 640, y: 180, width: 280, height: 520, minWidth: 250, minHeight: 300, titulo: 'Garrones' }
]

const BOTONES_DEFAULT: BotonConfig[] = [
  { id: 'aceptar', texto: 'ACEPTAR', visible: true, color: 'green' },
  { id: 'decomiso', texto: 'DECOMISO', visible: true, color: 'red' },
  { id: 'eliminar', texto: 'Eliminar', visible: true, color: 'orange' },
  { id: 'reimprimir', texto: 'Reimprimir', visible: true, color: 'blue' }
]

const TEXTOS_DEFAULT: TextosConfig = {
  tituloModulo: 'Romaneo - Pesaje de Medias',
  subtituloModulo: 'Pesaje y rotulado de medias reses',
  labelTipificador: 'Tipificador',
  labelCamara: 'Cámara',
  labelMedias: 'medias',
  labelPesajeActual: 'Pesaje Actual',
  labelTropa: 'Tropa',
  labelTipo: 'Tipo',
  labelPVivo: 'P. Vivo',
  labelEstado: 'Estado',
  labelPesoKg: 'Peso (kg)',
  labelDenticion: 'Dentición',
  labelGarrones: 'Garrones',
  labelTotal: 'Total',
  msgFaltaIzq: 'Falta Izq',
  msgFaltaDer: 'Falta Der',
  msgNoHayAnimal: 'No hay animal asignado al garrón',
  msgNoHayGarrones: 'No hay garrones',
  msgTodosAsignados: 'Todos los garrones pesados',
  btnDerecha: 'DERECHA',
  btnIzquierda: 'IZQUIERDA',
  btnAceptar: 'ACEPTAR',
  btnDecomiso: 'DECOMISO',
  btnEliminar: 'Eliminar',
  btnReimprimir: 'Reimprimir',
  btnConfigurar: 'Configurar',
  btnActualizar: 'Actualizar'
}

// ==================== COMPONENTE BLOQUE EDITABLE ====================
interface EditableBlockProps {
  bloque: BloqueLayout
  editMode: boolean
  onUpdate: (id: string, updates: Partial<BloqueLayout>) => void
  children: React.ReactNode
}

function EditableBlock({ bloque, editMode, onUpdate, children }: EditableBlockProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialPos, setInitialPos] = useState({ x: 0, y: 0, width: 0, height: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!editMode) return
    if ((e.target as HTMLElement).closest('.resize-handle')) return
    
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setInitialPos({ x: bloque.x, y: bloque.y, width: bloque.width, height: bloque.height })
  }

  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    if (!editMode) return
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeHandle(handle)
    setDragStart({ x: e.clientX, y: e.clientY })
    setInitialPos({ x: bloque.x, y: bloque.y, width: bloque.width, height: bloque.height })
  }

  useEffect(() => {
    if (!isDragging && !isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y

      if (isDragging) {
        onUpdate(bloque.id, { x: Math.max(0, initialPos.x + deltaX), y: Math.max(0, initialPos.y + deltaY) })
      } else if (isResizing && resizeHandle) {
        let newX = initialPos.x
        let newY = initialPos.y
        let newWidth = initialPos.width
        let newHeight = initialPos.height

        if (resizeHandle.includes('e')) newWidth = Math.max(bloque.minWidth, initialPos.width + deltaX)
        if (resizeHandle.includes('w')) {
          const widthDelta = initialPos.width - deltaX
          if (widthDelta >= bloque.minWidth) { newWidth = widthDelta; newX = initialPos.x + deltaX }
        }
        if (resizeHandle.includes('n')) {
          const heightDelta = initialPos.height - deltaY
          if (heightDelta >= bloque.minHeight) { newHeight = heightDelta; newY = initialPos.y + deltaY }
        }
        if (resizeHandle.includes('s')) newHeight = Math.max(bloque.minHeight, initialPos.height + deltaY)

        onUpdate(bloque.id, { x: Math.max(0, newX), y: Math.max(0, newY), width: newWidth, height: newHeight })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
      setResizeHandle(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, dragStart, initialPos, resizeHandle, bloque, onUpdate])

  return (
    <div
      className={cn(
        "absolute transition-shadow",
        editMode && "cursor-move",
        isDragging && "z-50 shadow-2xl",
        editMode && !isDragging && "hover:shadow-lg hover:ring-2 hover:ring-amber-400"
      )}
      style={{ left: bloque.x, top: bloque.y, width: bloque.width, height: bloque.height }}
      onMouseDown={handleMouseDown}
    >
      {editMode && (
        <div className="absolute -top-6 left-0 bg-amber-500 text-white text-xs px-2 py-1 rounded-t flex items-center gap-1">
          <Move className="w-3 h-3" />
          {bloque.label}
        </div>
      )}
      <div className="w-full h-full overflow-hidden">{children}</div>
      {editMode && (
        <>
          <div className="resize-handle absolute -top-1.5 -left-1.5 w-3 h-3 bg-amber-500 border border-white rounded-sm cursor-nw-resize z-10" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
          <div className="resize-handle absolute -top-1.5 -right-1.5 w-3 h-3 bg-amber-500 border border-white rounded-sm cursor-ne-resize z-10" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
          <div className="resize-handle absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-amber-500 border border-white rounded-sm cursor-sw-resize z-10" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
          <div className="resize-handle absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-amber-500 border border-white rounded-sm cursor-se-resize z-10" onMouseDown={(e) => handleResizeStart(e, 'se')} />
          <div className="resize-handle absolute top-1/2 -left-1.5 w-3 h-6 bg-amber-500 border border-white rounded-sm cursor-w-resize z-10 -translate-y-1/2" onMouseDown={(e) => handleResizeStart(e, 'w')} />
          <div className="resize-handle absolute top-1/2 -right-1.5 w-3 h-6 bg-amber-500 border border-white rounded-sm cursor-e-resize z-10 -translate-y-1/2" onMouseDown={(e) => handleResizeStart(e, 'e')} />
          <div className="resize-handle absolute -top-1.5 left-1/2 w-6 h-3 bg-amber-500 border border-white rounded-sm cursor-n-resize z-10 -translate-x-1/2" onMouseDown={(e) => handleResizeStart(e, 'n')} />
          <div className="resize-handle absolute -bottom-1.5 left-1/2 w-6 h-3 bg-amber-500 border border-white rounded-sm cursor-s-resize z-10 -translate-x-1/2" onMouseDown={(e) => handleResizeStart(e, 's')} />
        </>
      )}
    </div>
  )
}

export function RomaneoModule({ operador }: { operador: Operador }) {
  // Configuración del turno
  const [tipificadorId, setTipificadorId] = useState('')
  const [camaraId, setCamaraId] = useState('')
  const [configOpen, setConfigOpen] = useState(false)
  
  // Estado del pesaje
  const [garronActual, setGarronActual] = useState(1)
  const [ladoActual, setLadoActual] = useState<'DERECHA' | 'IZQUIERDA'>('DERECHA')
  const [pesoBalanza, setPesoBalanza] = useState('')
  const [denticion, setDenticion] = useState('')
  const [asignacionActual, setAsignacionActual] = useState<AsignacionGarron | null>(null)
  
  // Historial
  const [mediasPesadas, setMediasPesadas] = useState<MediaPesada[]>([])
  
  // Último rótulo para reimprimir
  const [ultimoRotulo, setUltimoRotulo] = useState<MediaPesada | null>(null)
  
  // Diálogo de decomiso
  const [decomisoOpen, setDecomisoOpen] = useState(false)
  const [kgDecomiso, setKgDecomiso] = useState('')
  const [kgRestantes, setKgRestantes] = useState('')
  
  // Datos maestros
  const [tipificadores, setTipificadores] = useState<Tipificador[]>([])
  const [camaras, setCamaras] = useState<Camara[]>([])
  const [garronesAsignados, setGarronesAsignados] = useState<AsignacionGarron[]>([])
  
  // UI
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Layout WYSIWYG
  const [editMode, setEditMode] = useState(false)
  const [showConfigPanel, setShowConfigPanel] = useState(false)
  const [bloques, setBloques] = useState<BloqueLayout[]>(LAYOUT_DEFAULT)
  const [botones, setBotones] = useState<BotonConfig[]>(BOTONES_DEFAULT)
  const [textos, setTextos] = useState<TextosConfig>(TEXTOS_DEFAULT)
  const [layoutLoaded, setLayoutLoaded] = useState(false)
  
  const isAdmin = operador.rol === 'ADMINISTRADOR' || (operador.permisos?.puedeAdminSistema ?? false)

  // Cargar datos iniciales
  useEffect(() => {
    fetchLayout()
    fetchData()
  }, [])

  const fetchLayout = async () => {
    try {
      const res = await fetch('/api/layout-modulo?modulo=romaneo')
      const data = await res.json()
      
      if (data.success) {
        if (data.data?.layout?.items) setBloques(data.data.layout.items)
        if (data.data?.botones?.items) setBotones(data.data.botones.items)
        if (data.data?.textos) setTextos({ ...TEXTOS_DEFAULT, ...data.data.textos })
      }
    } catch (error) {
      console.error('Error loading layout:', error)
    } finally {
      setLayoutLoaded(true)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tipRes, camRes, garronesRes] = await Promise.all([
        fetch('/api/tipificadores'),
        fetch('/api/camaras'),
        fetch('/api/garrones-asignados')
      ])
      
      const tipData = await tipRes.json()
      const camData = await camRes.json()
      const garronesData = await garronesRes.json()
      
      if (tipData.success) {
        setTipificadores(tipData.data || [])
        if (tipData.data?.length > 0) {
          setTipificadorId(tipData.data[0].id)
        }
      }
      
      if (camData.success) {
        const camarasFaena = (camData.data || []).filter((c: Camara) => c.tipo === 'FAENA')
        setCamaras(camarasFaena)
        if (camarasFaena.length > 0) {
          setCamaraId(camarasFaena[0].id)
        }
      }
      
      if (garronesData.success) {
        setGarronesAsignados(garronesData.data || [])
        
        const pendientes = (garronesData.data || []).filter((g: AsignacionGarron) => 
          !g.tieneMediaDer || !g.tieneMediaIzq
        )
        
        if (pendientes.length > 0) {
          const primero = pendientes[0]
          setGarronActual(primero.garron)
          setAsignacionActual(primero)
          setLadoActual(primero.tieneMediaDer ? 'IZQUIERDA' : 'DERECHA')
        } else if (garronesData.data?.length > 0) {
          const ultimo = garronesData.data[garronesData.data.length - 1]
          setGarronActual(ultimo.garron + 1)
          setAsignacionActual(null)
          setLadoActual('DERECHA')
        }
      }
      
      if (!tipificadorId || !camaraId) {
        setConfigOpen(true)
      }
      
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleCapturarPeso = useCallback(() => {
    const peso = pesoBalanza || (Math.random() * 50 + 100).toFixed(1)
    setPesoBalanza(peso)
  }, [pesoBalanza])

  const handleAceptarPeso = async (esDecomiso: boolean = false) => {
    if (!pesoBalanza || parseFloat(pesoBalanza) <= 0) {
      toast.error('Ingrese un peso válido')
      return
    }
    
    if (!tipificadorId || !camaraId) {
      setConfigOpen(true)
      toast.error('Configure tipificador y cámara primero')
      return
    }
    
    setSaving(true)
    try {
      const res = await fetch('/api/romaneo/pesar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garron: garronActual,
          lado: ladoActual,
          peso: parseFloat(pesoBalanza),
          siglas: SIGLAS,
          denticion: denticion,
          tipificadorId,
          camaraId,
          operadorId: operador.id,
          esDecomiso,
          kgDecomiso: esDecomiso ? parseFloat(kgDecomiso) : 0,
          kgRestantes: esDecomiso ? parseFloat(kgRestantes) : parseFloat(pesoBalanza)
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        // Imprimir rótulos
        await handleImprimirRotulos(garronActual, ladoActual, parseFloat(pesoBalanza), esDecomiso)
        
        const nuevaMedia: MediaPesada = {
          id: data.data.id,
          garron: garronActual,
          lado: ladoActual,
          peso: parseFloat(pesoBalanza),
          siglas: SIGLAS,
          fecha: new Date(),
          tropaCodigo: asignacionActual?.tropaCodigo || null,
          tipoAnimal: asignacionActual?.tipoAnimal || null,
          decomisada: esDecomiso,
          kgDecomiso: esDecomiso ? parseFloat(kgDecomiso) : undefined,
          kgRestantes: esDecomiso ? parseFloat(kgRestantes) : undefined
        }
        setMediasPesadas(prev => [...prev, nuevaMedia])
        setUltimoRotulo(nuevaMedia)
        
        if (esDecomiso) {
          toast.success(`Media decomisada - Garrón #${garronActual}`, {
            description: `Decomiso: ${kgDecomiso} kg | Restante: ${kgRestantes} kg`
          })
        } else {
          toast.success(`Media ${ladoActual === 'DERECHA' ? 'derecha' : 'izquierda'} registrada`)
        }
        
        setPesoBalanza('')
        setKgDecomiso('')
        setKgRestantes('')
        setDecomisoOpen(false)
        
        // Actualizar estado
        if (asignacionActual) {
          const actualizado = { ...asignacionActual }
          if (ladoActual === 'DERECHA') {
            actualizado.tieneMediaDer = true
          } else {
            actualizado.tieneMediaIzq = true
          }
          setAsignacionActual(actualizado)
        }
        
        // Avanzar al siguiente
        if (ladoActual === 'DERECHA') {
          setLadoActual('IZQUIERDA')
        } else {
          const nuevosGarrones = [...garronesAsignados]
          if (asignacionActual) {
            const idx = nuevosGarrones.findIndex(g => g.garron === garronActual)
            if (idx >= 0) {
              nuevosGarrones[idx] = {
                ...nuevosGarrones[idx],
                tieneMediaDer: true,
                tieneMediaIzq: true
              }
            }
          }
          
          const siguientePendiente = nuevosGarrones.find(g => 
            !g.tieneMediaDer || !g.tieneMediaIzq
          )
          
          if (siguientePendiente) {
            setGarronActual(siguientePendiente.garron)
            setAsignacionActual(siguientePendiente)
            setLadoActual(siguientePendiente.tieneMediaDer ? 'IZQUIERDA' : 'DERECHA')
          } else {
            const nuevoGarron = Math.max(...nuevosGarrones.map(g => g.garron), 0) + 1
            setGarronActual(nuevoGarron)
            setLadoActual('DERECHA')
            setAsignacionActual(null)
            toast.info('No hay más garrones pendientes')
          }
          
          setDenticion('')
          setGarronesAsignados(nuevosGarrones)
        }
      } else {
        toast.error(data.error || 'Error al registrar peso')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleImprimirRotulos = async (garron: number, lado: 'DERECHA' | 'IZQUIERDA', peso: number, esDecomiso: boolean = false) => {
    try {
      // Buscar el rótulo configurado para MEDIA_RES
      const rotulosRes = await fetch('/api/rotulos?tipo=MEDIA_RES&activo=true')
      const rotulosData = await rotulosRes.json()
      
      // Buscar el rótulo default o el primero activo
      const rotulo = rotulosData.find((r: any) => r.esDefault) || rotulosData[0]
      
      // Preparar datos para el rótulo
      const fecha = new Date()
      const fechaVenc = new Date(fecha.getTime() + (rotulo?.diasConsumo || 30) * 24 * 60 * 60 * 1000)
      const tipificador = tipificadores.find(t => t.id === tipificadorId)
      const camara = camaras.find(c => c.id === camaraId)
      
      const datosRotulo = {
        // Fechas
        fecha: formatearFecha(fecha),
        fecha_faena: formatearFecha(fecha),
        fecha_venc: formatearFecha(fechaVenc),
        fecha_vencimiento: formatearFecha(fechaVenc),
        
        // Tropa y animal
        tropa: asignacionActual?.tropaCodigo || '-',
        tropa_codigo: asignacionActual?.tropaCodigo || '-',
        garron: String(garron).padStart(3, '0'),
        numero_garron: String(garron).padStart(3, '0'),
        correlativo: String(garron).padStart(4, '0'),
        
        // Pesos
        peso: peso.toFixed(1),
        peso_kg: peso.toFixed(1) + ' KG',
        peso_vivo: asignacionActual?.pesoVivo?.toFixed(0) || '-',
        
        // Producto
        producto: 'MEDIA RES',
        nombre_producto: 'MEDIA RES',
        tipo_animal: asignacionActual?.tipoAnimal || '-',
        
        // Lado y sigla
        lado: lado === 'DERECHA' ? 'D' : 'I',
        lado_media: lado,
        
        // Dentición
        denticion: denticion || '-',
        dientes: denticion || '-',
        
        // Establecimiento
        establecimiento: 'SOLEMAR ALIMENTARIA',
        nombre_establecimiento: 'SOLEMAR ALIMENTARIA',
        
        // Tipificador
        tipificador: tipificador ? `${tipificador.nombre} ${tipificador.apellido}` : '-',
        matricula: tipificador?.matricula || '-',
        
        // Cámara
        camara: camara?.nombre || '-',
        
        // Decomiso
        decomisado: esDecomiso ? 'SI' : 'NO',
        
        // Código de barras
        codigo_barras: `${fecha.getFullYear().toString().slice(-2)}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}-${garron.toString().padStart(4, '0')}-${lado.charAt(0)}`,
      }

      if (!rotulo) {
        // Si no hay rótulo configurado, usar HTML
        imprimirRotuloHTML(garron, lado, peso, esDecomiso)
        return
      }

      // Imprimir 3 rótulos (A, T, D)
      for (const sigla of SIGLAS) {
        const datosConSigla = {
          ...datosRotulo,
          sigla: sigla,
          sigla_media: sigla,
          codigo_barras: `${fecha.getFullYear().toString().slice(-2)}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}-${garron.toString().padStart(4, '0')}-${lado.charAt(0)}-${sigla}`
        }
        
        // Llamar al API de impresión
        await fetch('/api/rotulos/imprimir', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rotuloId: rotulo.id,
            datos: datosConSigla,
            cantidad: 1
          })
        })
      }
      
      toast.success(`3 rótulos impresos para garrón #${garron}`, {
        description: `Plantilla: ${rotulo.nombre}`
      })
      
    } catch (error) {
      console.error('Error al imprimir:', error)
      imprimirRotuloHTML(garron, lado, peso, esDecomiso)
    }
  }

  // Función de impresión HTML fallback
  const imprimirRotuloHTML = (garron: number, lado: 'DERECHA' | 'IZQUIERDA', peso: number, esDecomiso: boolean = false) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600')
    if (!printWindow) {
      toast.error('No se pudo abrir ventana de impresión')
      return
    }
    
    const tipificador = tipificadores.find(t => t.id === tipificadorId)
    const camara = camaras.find(c => c.id === camaraId)
    const fecha = new Date()
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Rótulos Garrón ${garron} - ${lado}</title>
        <style>
          @page { size: 100mm 70mm; margin: 3mm; }
          body { font-family: Arial, sans-serif; padding: 5px; margin: 0; }
          .rotulo { 
            border: 2px solid black; 
            padding: 5px; 
            margin-bottom: 3mm;
            page-break-after: always;
            width: 94mm;
            height: 64mm;
            box-sizing: border-box;
            ${esDecomiso ? 'background: #fee2e2;' : ''}
          }
          .header { text-align: center; border-bottom: 1px solid black; padding-bottom: 3px; margin-bottom: 3px; }
          .empresa { font-size: 14px; font-weight: bold; }
          .campo { display: flex; justify-content: space-between; padding: 1px 0; font-size: 11px; }
          .sigla { font-size: 28px; font-weight: bold; text-align: center; background: #f0f0f0; padding: 3px; margin: 3px 0; }
          .barcode { font-family: 'Libre Barcode 39', cursive; font-size: 18px; text-align: center; margin-top: 3px; }
          .lado { font-size: 12px; text-align: center; font-weight: bold; background: ${lado === 'DERECHA' ? '#e3f2fd' : '#fce4ec'}; padding: 2px; }
          .decomiso { background: #dc2626; color: white; text-align: center; font-weight: bold; padding: 2px; font-size: 12px; }
        </style>
      </head>
      <body>
        ${SIGLAS.map(sigla => `
          <div class="rotulo">
            <div class="header">
              <div class="empresa">SOLEMAR ALIMENTARIA</div>
              <div style="font-size: 9px;">Media Res - Faena</div>
            </div>
            ${esDecomiso ? '<div class="decomiso">⚠️ DECOMISO ⚠️</div>' : ''}
            <div class="lado">${lado === 'DERECHA' ? 'MEDIA DERECHA' : 'MEDIA IZQUIERDA'}</div>
            <div class="campo"><span>Garrón:</span><span style="font-weight: bold; font-size: 14px;">${garron}</span></div>
            <div class="campo"><span>Tropa:</span><span>${asignacionActual?.tropaCodigo || '-'}</span></div>
            <div class="campo"><span>Tipo:</span><span>${asignacionActual?.tipoAnimal || '-'}</span></div>
            <div class="campo"><span>Peso:</span><span style="font-weight: bold;">${peso.toFixed(1)} kg</span></div>
            <div class="campo"><span>Cámara:</span><span>${camara?.nombre || '-'}</span></div>
            ${denticion ? `<div class="campo"><span>Dentición:</span><span>${denticion} dientes</span></div>` : ''}
            <div class="sigla">${sigla}</div>
            <div style="text-align: center; font-size: 10px;">${sigla === 'A' ? 'Asado' : sigla === 'T' ? 'Trasero' : 'Delantero'}</div>
            <div class="barcode">*${fecha.getFullYear().toString().slice(-2)}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}-${garron.toString().padStart(4, '0')}-${lado.charAt(0)}-${sigla}*</div>
            ${tipificador ? `<div style="text-align: center; font-size: 8px; margin-top: 2px;">Tip.: ${tipificador.nombre} ${tipificador.apellido} - Mat. ${tipificador.matricula}</div>` : ''}
          </div>
        `).join('')}
        <script>
          window.onload = function() { 
            window.print(); 
            window.onafterprint = function() { window.close(); } 
          }
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  const formatearFecha = (fecha: Date): string => {
    const dia = String(fecha.getDate()).padStart(2, '0')
    const mes = String(fecha.getMonth() + 1).padStart(2, '0')
    const anio = fecha.getFullYear()
    return `${dia}/${mes}/${anio}`
  }

  const handleReimprimirUltimo = () => {
    if (ultimoRotulo) {
      handleImprimirRotulos(ultimoRotulo.garron, ultimoRotulo.lado as 'DERECHA' | 'IZQUIERDA', ultimoRotulo.peso, ultimoRotulo.decomisada)
      toast.success('Reimprimiendo rótulos')
    } else {
      toast.error('No hay rótulos para reimprimir')
    }
  }

  const handleEliminarUltimo = async () => {
    if (mediasPesadas.length === 0) {
      toast.error('No hay medias para eliminar')
      return
    }
    
    const ultimo = mediasPesadas[mediasPesadas.length - 1]
    
    try {
      const res = await fetch(`/api/romaneo/eliminar`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          garron: ultimo.garron, 
          lado: ultimo.lado 
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        // Actualizar estado local
        const nuevasMedias = mediasPesadas.slice(0, -1)
        setMediasPesadas(nuevasMedias)
        
        // Actualizar garrones asignados
        const nuevosGarrones = [...garronesAsignados]
        const idx = nuevosGarrones.findIndex(g => g.garron === ultimo.garron)
        if (idx >= 0) {
          if (ultimo.lado === 'DERECHA') {
            nuevosGarrones[idx] = { ...nuevosGarrones[idx], tieneMediaDer: false }
          } else {
            nuevosGarrones[idx] = { ...nuevosGarrones[idx], tieneMediaIzq: false }
          }
        }
        setGarronesAsignados(nuevosGarrones)
        
        // Volver al garrón eliminado
        setGarronActual(ultimo.garron)
        setLadoActual(ultimo.lado as 'DERECHA' | 'IZQUIERDA')
        const asignacion = nuevosGarrones.find(g => g.garron === ultimo.garron)
        setAsignacionActual(asignacion || null)
        
        // Actualizar último rótulo
        setUltimoRotulo(nuevasMedias.length > 0 ? nuevasMedias[nuevasMedias.length - 1] : null)
        
        toast.success(`Media ${ultimo.lado === 'DERECHA' ? 'derecha' : 'izquierda'} del garrón #${ultimo.garron} eliminada`)
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    }
  }

  const handleSeleccionarGarron = (garron: number, lado: 'DERECHA' | 'IZQUIERDA') => {
    setGarronActual(garron)
    setLadoActual(lado)
    const asignacion = garronesAsignados.find(g => g.garron === garron)
    setAsignacionActual(asignacion || null)
    
    // Cargar dentición si ya se pesó la primera media
    if (lado === 'IZQUIERDA' && asignacion?.tieneMediaDer) {
      fetch(`/api/romaneo/denticion?garron=${garron}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.denticion) {
            setDenticion(data.denticion)
          }
        })
        .catch(e => console.error('Error cargando dentición:', e))
    } else {
      setDenticion('')
    }
    
    setPesoBalanza('')
  }

  const handleAbrirDecomiso = () => {
    if (!pesoBalanza || parseFloat(pesoBalanza) <= 0) {
      toast.error('Ingrese el peso de la media primero')
      return
    }
    setKgDecomiso('')
    setKgRestantes(pesoBalanza)
    setDecomisoOpen(true)
  }

  const handleConfirmarDecomiso = () => {
    const decomiso = parseFloat(kgDecomiso)
    const restantes = parseFloat(kgRestantes)
    const pesoTotal = parseFloat(pesoBalanza)
    
    if (isNaN(decomiso) || decomiso < 0) {
      toast.error('Ingrese kg de decomiso válidos')
      return
    }
    
    if (isNaN(restantes) || restantes < 0) {
      toast.error('Ingrese kg restantes válidos')
      return
    }
    
    if (decomiso + restantes !== pesoTotal) {
      toast.error(`La suma de decomiso (${decomiso}) + restantes (${restantes}) debe ser igual al peso total (${pesoTotal})`)
      return
    }
    
    setDecomisoOpen(false)
    handleAceptarPeso(true)
  }

  // Agrupar medias por garrón
  const garronesAgrupados = useCallback(() => {
    const grupos: Record<number, { der: MediaPesada | null, izq: MediaPesada | null }> = {}
    
    // Primero agregar todos los garrones asignados
    garronesAsignados.forEach(g => {
      grupos[g.garron] = { der: null, izq: null }
    })
    
    // Luego agregar las medias pesadas
    mediasPesadas.forEach(m => {
      if (!grupos[m.garron]) {
        grupos[m.garron] = { der: null, izq: null }
      }
      if (m.lado === 'DERECHA') {
        grupos[m.garron].der = m
      } else {
        grupos[m.garron].izq = m
      }
    })
    
    // Convertir a array y ordenar por garrón
    return Object.entries(grupos)
      .map(([garron, medias]) => ({
        garron: parseInt(garron),
        der: medias.der,
        izq: medias.izq,
        completo: medias.der && medias.izq
      }))
      .sort((a, b) => a.garron - b.garron)
  }, [mediasPesadas, garronesAsignados])

  const getTotalKg = () => {
    return mediasPesadas.reduce((acc, m) => acc + m.peso, 0)
  }

  // Funciones de layout
  const updateBloque = useCallback((id: string, updates: Partial<BloqueLayout>) => {
    setBloques(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))
  }, [])

  const updateBoton = (id: string, updates: Partial<BotonConfig>) => {
    setBotones(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b))
  }

  const updateTexto = (key: keyof TextosConfig, value: string) => {
    setTextos(prev => ({ ...prev, [key]: value }))
  }

  const moveBloqueUp = (id: string) => {
    const idx = bloques.findIndex(b => b.id === id)
    if (idx > 0) {
      const newBloques = [...bloques]
      const tempY = newBloques[idx - 1].y
      newBloques[idx - 1] = { ...newBloques[idx - 1], y: newBloques[idx].y }
      newBloques[idx] = { ...newBloques[idx], y: tempY }
      setBloques(newBloques)
    }
  }

  const moveBloqueDown = (id: string) => {
    const idx = bloques.findIndex(b => b.id === id)
    if (idx < bloques.length - 1) {
      const newBloques = [...bloques]
      const tempY = newBloques[idx + 1].y
      newBloques[idx + 1] = { ...newBloques[idx + 1], y: newBloques[idx].y }
      newBloques[idx] = { ...newBloques[idx], y: tempY }
      setBloques(newBloques)
    }
  }

  const handleSaveLayout = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/layout-modulo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modulo: 'romaneo',
          layout: { items: bloques },
          botones: { items: botones },
          textos: textos
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Layout guardado correctamente')
        setEditMode(false)
        setShowConfigPanel(false)
      } else toast.error(data.error || 'Error al guardar')
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('Error al guardar layout')
    } finally { setSaving(false) }
  }

  const resetLayout = () => {
    setBloques(LAYOUT_DEFAULT)
    setBotones(BOTONES_DEFAULT)
    setTextos(TEXTOS_DEFAULT)
    toast.info('Layout restablecido')
  }

  if (loading || !layoutLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center">
        <Scale className="w-8 h-8 animate-pulse text-amber-500" />
      </div>
    )
  }

  const garronesLista = garronesAgrupados()
  const bloquesVisibles = bloques.filter(b => b.visible)
  const getBloque = (id: string) => bloques.find(b => b.id === id)
  const getBoton = (id: string) => botones.find(b => b.id === id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 pb-8">
      
      {/* Botón flotante de edición */}
      {isAdmin && (
        <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
          {!editMode ? (
            <Button variant="outline" size="icon" onClick={() => { setEditMode(true); setShowConfigPanel(true) }} className="bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 shadow-lg h-10 w-10" title="Editar Layout">
              <Edit3 className="w-5 h-5" />
            </Button>
          ) : (
            <>
              <Button variant="outline" size="icon" onClick={() => setShowConfigPanel(!showConfigPanel)} className="bg-white border-stone-300 shadow-lg h-10 w-10" title="Configuración"><Settings2 className="w-5 h-5" /></Button>
              <Button variant="outline" size="icon" onClick={resetLayout} className="bg-white border-stone-300 shadow-lg h-10 w-10" title="Resetear"><RefreshCw className="w-5 h-5" /></Button>
              <Button variant="outline" size="icon" onClick={() => { setEditMode(false); setShowConfigPanel(false) }} className="bg-white border-stone-300 shadow-lg h-10 w-10" title="Cancelar"><X className="w-5 h-5" /></Button>
              <Button size="icon" onClick={handleSaveLayout} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white shadow-lg h-10 w-10" title="Guardar"><Save className="w-5 h-5" /></Button>
            </>
          )}
        </div>
      )}

      {/* Panel de configuración lateral */}
      {editMode && showConfigPanel && (
        <div className="fixed top-36 right-4 z-50 w-96 bg-white rounded-lg shadow-2xl border-2 border-amber-200 max-h-[75vh] overflow-hidden">
          <div className="bg-amber-50 px-4 py-3 border-b border-amber-200">
            <h3 className="font-bold text-amber-800 flex items-center gap-2"><Settings2 className="w-4 h-4" /> Personalización Completa</h3>
          </div>
          
          <Tabs defaultValue="secciones" className="w-full">
            <TabsList className="w-full grid grid-cols-3 bg-stone-100">
              <TabsTrigger value="secciones" className="text-xs">Secciones</TabsTrigger>
              <TabsTrigger value="textos" className="text-xs">Textos</TabsTrigger>
              <TabsTrigger value="botones" className="text-xs">Botones</TabsTrigger>
            </TabsList>
            
            <ScrollArea className="h-[55vh]">
              <TabsContent value="secciones" className="p-4 space-y-2">
                <h4 className="font-medium text-sm text-stone-500 flex items-center gap-1"><Eye className="w-4 h-4" /> Visibilidad y Orden</h4>
                {bloques.map((bloque) => (
                  <div key={bloque.id} className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveBloqueUp(bloque.id)}><ChevronUp className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveBloqueDown(bloque.id)}><ChevronDown className="w-3 h-3" /></Button>
                    <span className="flex-1 text-sm font-medium">{bloque.label}</span>
                    <Switch checked={bloque.visible} onCheckedChange={(v) => updateBloque(bloque.id, { visible: v })} />
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="textos" className="p-4 space-y-3">
                <h4 className="font-medium text-sm text-stone-500 flex items-center gap-1"><Type className="w-4 h-4" /> Textos del Módulo</h4>
                
                <div className="space-y-2">
                  <Label className="text-xs">Título del Módulo</Label>
                  <Input value={textos.tituloModulo} onChange={(e) => updateTexto('tituloModulo', e.target.value)} className="h-8" />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Subtítulo</Label>
                  <Input value={textos.subtituloModulo} onChange={(e) => updateTexto('subtituloModulo', e.target.value)} className="h-8" />
                </div>

                <Separator />
                <h4 className="font-medium text-sm text-stone-500">Labels de Configuración</h4>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Tipificador</Label>
                    <Input value={textos.labelTipificador} onChange={(e) => updateTexto('labelTipificador', e.target.value)} className="h-8" />
                  </div>
                  <div>
                    <Label className="text-xs">Cámara</Label>
                    <Input value={textos.labelCamara} onChange={(e) => updateTexto('labelCamara', e.target.value)} className="h-8" />
                  </div>
                </div>

                <Separator />
                <h4 className="font-medium text-sm text-stone-500">Labels del Pesaje</h4>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Tropa</Label>
                    <Input value={textos.labelTropa} onChange={(e) => updateTexto('labelTropa', e.target.value)} className="h-8" />
                  </div>
                  <div>
                    <Label className="text-xs">Tipo</Label>
                    <Input value={textos.labelTipo} onChange={(e) => updateTexto('labelTipo', e.target.value)} className="h-8" />
                  </div>
                  <div>
                    <Label className="text-xs">P. Vivo</Label>
                    <Input value={textos.labelPVivo} onChange={(e) => updateTexto('labelPVivo', e.target.value)} className="h-8" />
                  </div>
                  <div>
                    <Label className="text-xs">Estado</Label>
                    <Input value={textos.labelEstado} onChange={(e) => updateTexto('labelEstado', e.target.value)} className="h-8" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Peso (kg)</Label>
                    <Input value={textos.labelPesoKg} onChange={(e) => updateTexto('labelPesoKg', e.target.value)} className="h-8" />
                  </div>
                  <div>
                    <Label className="text-xs">Dentición</Label>
                    <Input value={textos.labelDenticion} onChange={(e) => updateTexto('labelDenticion', e.target.value)} className="h-8" />
                  </div>
                </div>

                <Separator />
                <h4 className="font-medium text-sm text-stone-500">Labels de Botones</h4>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Derecha</Label>
                    <Input value={textos.btnDerecha} onChange={(e) => updateTexto('btnDerecha', e.target.value)} className="h-8" />
                  </div>
                  <div>
                    <Label className="text-xs">Izquierda</Label>
                    <Input value={textos.btnIzquierda} onChange={(e) => updateTexto('btnIzquierda', e.target.value)} className="h-8" />
                  </div>
                  <div>
                    <Label className="text-xs">Aceptar</Label>
                    <Input value={textos.btnAceptar} onChange={(e) => updateTexto('btnAceptar', e.target.value)} className="h-8" />
                  </div>
                  <div>
                    <Label className="text-xs">Decomiso</Label>
                    <Input value={textos.btnDecomiso} onChange={(e) => updateTexto('btnDecomiso', e.target.value)} className="h-8" />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="botones" className="p-4 space-y-3">
                <h4 className="font-medium text-sm text-stone-500 flex items-center gap-1"><Palette className="w-4 h-4" /> Botones de Acción</h4>
                {botones.map((btn) => (
                  <div key={btn.id} className="p-3 bg-stone-50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Botón: {btn.id}</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-500">Visible</span>
                        <Switch checked={btn.visible} onCheckedChange={(v) => updateBoton(btn.id, { visible: v })} />
                      </div>
                    </div>
                    <Input value={btn.texto} onChange={(e) => updateBoton(btn.id, { texto: e.target.value })} className="h-8" placeholder="Texto del botón" />
                  </div>
                ))}
              </TabsContent>
            </ScrollArea>
          </Tabs>
          
          <div className="p-3 bg-amber-50 border-t border-amber-200">
            <p className="text-xs text-amber-700">
              <strong>💡</strong> Arrastrá bloques para moverlos. Usá los handles amarillos para redimensionar. Click en <Save className="w-3 h-3 inline" /> para guardar.
            </p>
          </div>
        </div>
      )}

      {/* Área de trabajo WYSIWYG */}
      <div 
        className={cn("relative mt-8 bg-white rounded-lg shadow-inner border-2 min-h-[800px]", editMode ? "border-amber-300 border-dashed" : "border-transparent")}
        style={{ minHeight: editMode ? Math.max(800, ...bloquesVisibles.map(b => b.y + b.height + 50)) : 'auto' }}
      >
        {editMode && <div className="absolute inset-0 pointer-events-none rounded-lg" style={{ backgroundImage: 'linear-gradient(to right, #fbbf2420 1px, transparent 1px), linear-gradient(to bottom, #fbbf2420 1px, transparent 1px)', backgroundSize: '50px 50px' }} />}

        {/* BLOQUE: Header */}
        {bloquesVisibles.find(b => b.id === 'header') && (
          <EditableBlock bloque={getBloque('header')!} editMode={editMode} onUpdate={updateBloque}>
            <div className="h-full bg-gradient-to-r from-stone-800 to-stone-700 p-4 rounded-lg flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white">{textos.tituloModulo}</h1>
                <p className="text-stone-300 text-sm">{textos.subtituloModulo}</p>
              </div>
              <div className="flex items-center gap-2">
                {getBoton('eliminar')?.visible && (
                  <Button variant="outline" size="sm" onClick={handleEliminarUltimo} disabled={mediasPesadas.length === 0} className="bg-red-600 border-red-700 text-white hover:bg-red-700">
                    <Trash2 className="w-4 h-4 mr-1" /> {textos.btnEliminar}
                  </Button>
                )}
                {getBoton('reimprimir')?.visible && (
                  <Button variant="outline" size="sm" onClick={handleReimprimirUltimo} disabled={!ultimoRotulo} className="bg-blue-600 border-blue-700 text-white hover:bg-blue-700">
                    <RotateCcw className="w-4 h-4 mr-1" /> {textos.btnReimprimir}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setConfigOpen(true)} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <User className="w-4 h-4 mr-1" /> {textos.btnConfigurar}
                </Button>
                <Button variant="outline" size="sm" onClick={fetchData} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <RefreshCw className="w-4 h-4 mr-1" /> {textos.btnActualizar}
                </Button>
              </div>
            </div>
          </EditableBlock>
        )}

        {/* BLOQUE: Configuración */}
        {bloquesVisibles.find(b => b.id === 'configuracion') && (
          <EditableBlock bloque={getBloque('configuracion')!} editMode={editMode} onUpdate={updateBloque}>
            <div className="h-full bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4 text-amber-600" />
                  <strong>{textos.labelTipificador}:</strong> {tipificadores.find(t => t.id === tipificadorId)?.nombre || 'Sin asignar'}
                </span>
                <div className="flex items-center gap-1">
                  <Warehouse className="w-4 h-4 text-amber-600" />
                  <strong>{textos.labelCamara}:</strong>
                  <Select value={camaraId} onValueChange={setCamaraId}>
                    <SelectTrigger className="h-7 w-40 bg-white border-amber-200">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {camaras.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Badge variant="outline">
                {mediasPesadas.length} {textos.labelMedias} - {getTotalKg().toFixed(1)} kg
              </Badge>
            </div>
          </EditableBlock>
        )}

        {/* BLOQUE: Panel de Pesaje */}
        {bloquesVisibles.find(b => b.id === 'panelPesaje') && (
          <EditableBlock bloque={getBloque('panelPesaje')!} editMode={editMode} onUpdate={updateBloque}>
            <Card className="h-full border-0 shadow-md overflow-hidden">
              <CardHeader className="bg-stone-50 py-2 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{getBloque('panelPesaje')?.titulo || textos.labelPesajeActual}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      const idx = garronesLista.findIndex(g => g.garron === garronActual)
                      if (idx > 0) {
                        const prev = garronesLista[idx - 1]
                        handleSeleccionarGarron(prev.garron, prev.der ? 'IZQUIERDA' : 'DERECHA')
                      }
                    }}>
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <span className="text-2xl font-bold text-amber-600 min-w-[60px] text-center">
                      #{garronActual}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => {
                      const idx = garronesLista.findIndex(g => g.garron === garronActual)
                      if (idx < garronesLista.length - 1) {
                        const next = garronesLista[idx + 1]
                        handleSeleccionarGarron(next.garron, next.der ? 'IZQUIERDA' : 'DERECHA')
                      }
                    }}>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-3 overflow-auto" style={{ height: 'calc(100% - 50px)' }}>
                {/* Datos del animal */}
                {asignacionActual ? (
                  <div className="grid grid-cols-4 gap-2 p-2 bg-stone-50 rounded-lg text-xs">
                    <div>
                      <span className="text-stone-500 block">{textos.labelTropa}</span>
                      <span className="font-medium">{asignacionActual.tropaCodigo || '-'}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">{textos.labelTipo}</span>
                      <span className="font-medium">{asignacionActual.tipoAnimal || '-'}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">{textos.labelPVivo}</span>
                      <span className="font-medium">{asignacionActual.pesoVivo?.toFixed(0) || '-'} kg</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">{textos.labelEstado}</span>
                      <span className="font-medium">
                        {asignacionActual.tieneMediaDer && asignacionActual.tieneMediaIzq ? '✓ Completo' : 
                         asignacionActual.tieneMediaDer ? textos.msgFaltaIzq : textos.msgFaltaDer}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-xs">
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    {textos.msgNoHayAnimal} {garronActual}
                  </div>
                )}

                <Separator />

                {/* Lado actual */}
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant={ladoActual === 'DERECHA' ? 'default' : 'outline'}
                    size="sm"
                    className={`h-10 px-6 ${ladoActual === 'DERECHA' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    onClick={() => setLadoActual('DERECHA')}
                    disabled={asignacionActual?.tieneMediaDer}
                  >
                    {textos.btnDerecha} {asignacionActual?.tieneMediaDer && <CheckCircle className="w-3 h-3 ml-1" />}
                  </Button>
                  <Button
                    variant={ladoActual === 'IZQUIERDA' ? 'default' : 'outline'}
                    size="sm"
                    className={`h-10 px-6 ${ladoActual === 'IZQUIERDA' ? 'bg-pink-600 hover:bg-pink-700' : ''}`}
                    onClick={() => setLadoActual('IZQUIERDA')}
                    disabled={!asignacionActual?.tieneMediaDer || asignacionActual?.tieneMediaIzq}
                  >
                    {textos.btnIzquierda} {asignacionActual?.tieneMediaIzq && <CheckCircle className="w-3 h-3 ml-1" />}
                  </Button>
                </div>

                {/* Peso */}
                <div className="text-center">
                  <Label className="text-base">{textos.labelPesoKg}</Label>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Input
                      type="number"
                      value={pesoBalanza}
                      onChange={(e) => setPesoBalanza(e.target.value)}
                      className="text-3xl font-bold text-center h-16 w-40"
                      placeholder="0"
                      step="0.1"
                    />
                    <Button variant="outline" size="lg" onClick={handleCapturarPeso}>
                      <Scale className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Dentición */}
                <div className="space-y-1">
                  <Label className="text-xs">
                    {textos.labelDenticion}
                    {asignacionActual?.tieneMediaDer && (
                      <span className="ml-2 text-xs text-amber-600 font-normal">(Fijado)</span>
                    )}
                  </Label>
                  <div className="flex gap-1">
                    {DIENTES.map((d) => (
                      <Button
                        key={d}
                        variant={denticion === d ? 'default' : 'outline'}
                        size="sm"
                        className={`flex-1 h-10 ${denticion === d ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                        onClick={() => setDenticion(d)}
                        disabled={asignacionActual?.tieneMediaDer && denticion !== '' && denticion !== d}
                      >
                        {d}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Botones de acción */}
                <div className="grid grid-cols-2 gap-2">
                  {getBoton('aceptar')?.visible && (
                    <Button
                      onClick={() => handleAceptarPeso(false)}
                      disabled={saving || !pesoBalanza || parseFloat(pesoBalanza) <= 0}
                      className="h-12 bg-green-600 hover:bg-green-700"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      {saving ? 'Guardando...' : textos.btnAceptar}
                    </Button>
                  )}
                  {getBoton('decomiso')?.visible && (
                    <Button
                      onClick={handleAbrirDecomiso}
                      disabled={saving || !pesoBalanza || parseFloat(pesoBalanza) <= 0}
                      variant="outline"
                      className="h-12 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <AlertOctagon className="w-4 h-4 mr-2" />
                      {textos.btnDecomiso}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </EditableBlock>
        )}

        {/* BLOQUE: Historial de Medias */}
        {bloquesVisibles.find(b => b.id === 'historialMedias') && (
          <EditableBlock bloque={getBloque('historialMedias')!} editMode={editMode} onUpdate={updateBloque}>
            <Card className="h-full border-0 shadow-md overflow-hidden">
              <CardHeader className="bg-stone-50 py-2 px-4">
                <CardTitle className="text-sm">{getBloque('historialMedias')?.titulo || textos.labelGarrones} ({garronesLista.filter(g => g.completo).length}/{garronesLista.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-auto" style={{ height: 'calc(100% - 45px)' }}>
                {garronesLista.length === 0 ? (
                  <div className="p-4 text-center text-stone-400">
                    <Scale className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{textos.msgNoHayGarrones}</p>
                  </div>
                ) : (
                  <div className="divide-y max-h-96 overflow-y-auto">
                    {garronesLista.map((g) => {
                      const isPendienteDer = !g.der && garronesAsignados.find(ga => ga.garron === g.garron)
                      const isPendienteIzq = g.der && !g.izq && garronesAsignados.find(ga => ga.garron === g.garron && ga.tieneMediaDer && !ga.tieneMediaIzq)
                      
                      return (
                        <div 
                          key={g.garron}
                          className={cn(
                            "p-2 cursor-pointer hover:bg-stone-50",
                            g.garron === garronActual && "bg-amber-50 border-l-4 border-amber-500"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-base text-amber-600">#{g.garron}</span>
                            {g.completo && <CheckCircle className="w-4 h-4 text-green-500" />}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-1">
                            {/* Media Derecha */}
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(
                                "h-auto py-1 px-2 justify-start text-xs",
                                g.der?.decomisada ? "bg-red-50 border-red-200" : 
                                g.der ? "bg-blue-50 border-blue-200" : 
                                isPendienteDer ? "border-dashed" : "opacity-50"
                              )}
                              onClick={() => handleSeleccionarGarron(g.garron, 'DERECHA')}
                              disabled={!!g.der}
                            >
                              <span className="font-medium">DER</span>
                              {g.der ? (
                                <span className="ml-auto">{g.der.peso.toFixed(1)} kg</span>
                              ) : isPendienteDer ? (
                                <span className="ml-auto text-stone-400">Pend.</span>
                              ) : null}
                              {g.der?.decomisada && <AlertOctagon className="w-3 h-3 ml-1 text-red-500" />}
                            </Button>
                            
                            {/* Media Izquierda */}
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(
                                "h-auto py-1 px-2 justify-start text-xs",
                                g.izq?.decomisada ? "bg-red-50 border-red-200" : 
                                g.izq ? "bg-pink-50 border-pink-200" : 
                                isPendienteIzq ? "border-dashed" : "opacity-50"
                              )}
                              onClick={() => handleSeleccionarGarron(g.garron, 'IZQUIERDA')}
                              disabled={!!g.izq}
                            >
                              <span className="font-medium">IZQ</span>
                              {g.izq ? (
                                <span className="ml-auto">{g.izq.peso.toFixed(1)} kg</span>
                              ) : isPendienteIzq ? (
                                <span className="ml-auto text-stone-400">Pend.</span>
                              ) : null}
                              {g.izq?.decomisada && <AlertOctagon className="w-3 h-3 ml-1 text-red-500" />}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                <div className="p-2 border-t bg-stone-50">
                  <div className="flex justify-between text-xs">
                    <span>{textos.labelTotal}: {mediasPesadas.length} {textos.labelMedias}</span>
                    <span className="font-bold">{getTotalKg().toFixed(1)} kg</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </EditableBlock>
        )}
      </div>

      {/* Diálogo de Configuración */}
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuración de Romaneo</DialogTitle>
            <DialogDescription>
              Seleccione el tipificador y la cámara para esta sesión
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{textos.labelTipificador}</Label>
              <Select value={tipificadorId} onValueChange={setTipificadorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipificador" />
                </SelectTrigger>
                <SelectContent>
                  {tipificadores.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nombre} {t.apellido} - Mat: {t.matricula}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{textos.labelCamara}</Label>
              <Select value={camaraId} onValueChange={setCamaraId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cámara" />
                </SelectTrigger>
                <SelectContent>
                  {camaras.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre} ({c.tipo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setConfigOpen(false)} disabled={!tipificadorId || !camaraId}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Decomiso */}
      <Dialog open={decomisoOpen} onOpenChange={setDecomisoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5" />
              Registrar Decomiso
            </DialogTitle>
            <DialogDescription>
              Ingrese los kilogramos decomisados y los restantes para el garrón #{garronActual}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-amber-50 rounded-lg text-center">
              <span className="text-sm text-amber-600">Peso total de la media</span>
              <div className="text-2xl font-bold text-amber-700">{pesoBalanza} kg</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-red-600">Kg Decomisados</Label>
                <Input
                  type="number"
                  value={kgDecomiso}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0
                    setKgDecomiso(e.target.value)
                    if (pesoBalanza) {
                      const restante = parseFloat(pesoBalanza) - val
                      setKgRestantes(restante >= 0 ? restante.toString() : '0')
                    }
                  }}
                  placeholder="0"
                  step="0.1"
                />
              </div>
              <div className="space-y-2">
                <Label>Kg Restantes</Label>
                <Input
                  type="number"
                  value={kgRestantes}
                  onChange={(e) => setKgRestantes(e.target.value)}
                  placeholder="0"
                  step="0.1"
                />
              </div>
            </div>
            {kgRestantes === '0' && (
              <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
                <strong>DECOMISO TOTAL</strong> - La media será marcada como decomisada completamente
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecomisoOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmarDecomiso}>
              Confirmar Decomiso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RomaneoModule
