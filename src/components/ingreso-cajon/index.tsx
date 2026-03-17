'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  BoxSelect, RefreshCw, Link2, Hash, CheckCircle, AlertTriangle,
  Delete, Check, Edit3, Save, X, Move,
  Eye, EyeOff, Settings2, ChevronUp, ChevronDown, Type, Palette
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ==================== TIPOS ====================
interface AnimalLista {
  id: string
  codigo: string
  tropaCodigo: string
  tipoAnimal: string
  pesoVivo: number | null
  numero: number
  garronAsignado: number | null
}

interface GarronAsignado {
  garron: number
  animalId: string | null
  animalCodigo: string | null
  tropaCodigo: string | null
  tipoAnimal: string | null
  pesoVivo: number | null
  completado: boolean
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
  // Textos personalizables
  titulo?: string
  subtitulo?: string
  placeholder?: string
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
  labelProximoGarron: string
  labelLista: string
  labelAsignados: string
  labelPendientes: string
  labelSinIdentificar: string
  labelAnimalEncontrado: string
  labelNoEncontrado: string
  labelSinGarrones: string
  textoDisplayVacio: string
}

// Valores por defecto
const LAYOUT_DEFAULT: BloqueLayout[] = [
  { id: 'header', label: 'Encabezado', visible: true, x: 20, y: 20, width: 900, height: 70, minWidth: 300, minHeight: 60, titulo: 'Ingreso a Cajón', subtitulo: 'Asignación de garrones' },
  { id: 'resumen', label: 'Resumen', visible: true, x: 20, y: 100, width: 900, height: 60, minWidth: 200, minHeight: 50 },
  { id: 'teclado', label: 'Teclado Numérico', visible: true, x: 20, y: 180, width: 450, height: 580, minWidth: 320, minHeight: 400, titulo: 'Ingreso de Número', placeholder: 'Número de Animal' },
  { id: 'listaGarrones', label: 'Lista de Garrones', visible: true, x: 490, y: 180, width: 430, height: 580, minWidth: 250, minHeight: 300, titulo: 'Garrones Asignados', subtitulo: 'Últimas asignaciones' }
]

const BOTONES_DEFAULT: BotonConfig[] = [
  { id: 'asignar', texto: 'ASIGNAR GARRÓN', visible: true, color: 'green' },
  { id: 'sinIdentificar', texto: 'ASIGNAR SIN IDENTIFICAR', visible: true, color: 'orange' }
]

const TEXTOS_DEFAULT: TextosConfig = {
  tituloModulo: 'Ingreso a Cajón',
  subtituloModulo: 'Asignación de garrones',
  labelProximoGarron: 'Próximo',
  labelLista: 'Lista',
  labelAsignados: 'Asignados',
  labelPendientes: 'Pendientes',
  labelSinIdentificar: 'Sin identificar',
  labelAnimalEncontrado: 'Animal encontrado',
  labelNoEncontrado: 'No se encontró animal',
  labelSinGarrones: 'No hay garrones asignados',
  textoDisplayVacio: '_ _ _'
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

// ==================== TIPOS PARA CUPOS ====================
interface CupoTropa {
  tropaId: string
  tropaCodigo: string
  tropaNumero: number
  usuarioFaena: string
  cantidadAsignada: number
  cantidadAsignadaGarron: number
  cantidadPendiente: number
  animalesDisponibles: number
}

interface GarronItem {
  garron: number
  tropaId: string
  tropaCodigo: string
  usuarioFaena: string
  animalNumero: number | null
  animalId: string | null
  tipoAnimal: string | null
  pesoVivo: number | null
  completado: boolean
  asignado: boolean
}

// ==================== COMPONENTE PRINCIPAL ====================
export function IngresoCajonModule({ operador }: { operador: Operador }) {
  // Datos - NUEVO SISTEMA DE GARRONES ORDENADOS
  const [garrones, setGarrones] = useState<GarronItem[]>([])
  const [totalAsignados, setTotalAsignados] = useState(0)
  const [totalPendientes, setTotalPendientes] = useState(0)
  const [listaFaenaId, setListaFaenaId] = useState<string | null>(null)
  const [garronesAsignados, setGarronesAsignados] = useState<GarronAsignado[]>([])
  
  // Estado
  const [proximoGarron, setProximoGarron] = useState(1)
  const [garronActual, setGarronActual] = useState<GarronItem | null>(null)
  const [numeroAnimal, setNumeroAnimal] = useState('')
  const [animalEncontrado, setAnimalEncontrado] = useState<AnimalLista | null>(null)
  
  // UI
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Layout
  const [editMode, setEditMode] = useState(false)
  const [showConfigPanel, setShowConfigPanel] = useState(false)
  const [bloques, setBloques] = useState<BloqueLayout[]>(LAYOUT_DEFAULT)
  const [botones, setBotones] = useState<BotonConfig[]>(BOTONES_DEFAULT)
  const [textos, setTextos] = useState<TextosConfig>(TEXTOS_DEFAULT)
  const [layoutLoaded, setLayoutLoaded] = useState(false)
  
  const isAdmin = operador.rol === 'ADMINISTRADOR' || (operador.permisos?.puedeAdminSistema ?? false)

  useEffect(() => {
    fetchLayout()
    fetchData()
  }, [])

  const fetchLayout = async () => {
    try {
      const res = await fetch('/api/layout-modulo?modulo=ingresoCajon')
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

  // Obtener garrones ordenados con tropa asignada
  const fetchData = async () => {
    setLoading(true)
    try {
      const [garronesRes, asignacionesRes] = await Promise.all([
        fetch('/api/lista-faena/garrones'),
        fetch('/api/garrones-asignados')
      ])
      
      const garronesData = await garronesRes.json()
      const asignacionesData = await asignacionesRes.json()
      
      if (garronesData.success) {
        setGarrones(garronesData.data.garrones || [])
        setTotalAsignados(garronesData.data.totalAsignados || 0)
        setTotalPendientes(garronesData.data.totalPendientes || 0)
        setListaFaenaId(garronesData.data.listaId)
        setProximoGarron(garronesData.data.proximoGarron || 1)
        
        // Encontrar el garrón actual (próximo pendiente)
        const pendiente = garronesData.data.garrones?.find((g: GarronItem) => !g.asignado)
        setGarronActual(pendiente || null)
      }
      
      if (asignacionesData.success) {
        setGarronesAsignados(asignacionesData.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (key: string) => {
    if (key === 'clear') { setNumeroAnimal(''); setAnimalEncontrado(null) }
    else if (key === 'backspace') { setNumeroAnimal(prev => prev.slice(0, -1)); setAnimalEncontrado(null) }
    else if (numeroAnimal.length < 4) {
      const newNumber = numeroAnimal + key
      setNumeroAnimal(newNumber)
      if (newNumber.length >= 1) buscarAnimal(newNumber)
    }
  }

  // Buscar animal por número en la tropa del garrón actual
  const buscarAnimal = async (numero: string) => {
    const numInt = parseInt(numero)
    if (isNaN(numInt)) {
      setAnimalEncontrado(null)
      return
    }

    if (!garronActual) {
      toast.warning('No hay garrones pendientes')
      setAnimalEncontrado(null)
      return
    }

    // Buscar animal en la tropa del garrón actual
    try {
      const res = await fetch(`/api/animales/buscar?numero=${numInt}&tropaId=${garronActual.tropaId}`)
      const data = await res.json()
      
      if (data.success && data.data) {
        setAnimalEncontrado({
          id: data.data.id,
          codigo: data.data.codigo,
          tropaCodigo: data.data.tropaCodigo,
          tipoAnimal: data.data.tipoAnimal,
          pesoVivo: data.data.pesoVivo,
          numero: data.data.numero,
          garronAsignado: null
        })
      } else {
        setAnimalEncontrado(null)
        if (data.error) {
          toast.error(data.error)
        }
      }
    } catch (error) {
      console.error('Error buscando animal:', error)
      setAnimalEncontrado(null)
    }
  }

  // Asignar garrón al animal encontrado
  const handleAsignarGarron = async (animalId: string | null) => {
    if (!garronActual) {
      toast.error('No hay garrón pendiente')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/garrones-asignados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          garron: garronActual.garron, 
          animalId: animalId || null, 
          tropaCodigo: garronActual.tropaCodigo,
          listaFaenaId: listaFaenaId,
          operadorId: operador.id 
        })
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success(`Garrón #${garronActual.garron} asignado`, { 
          description: data.data.animalCodigo 
            ? `Animal: ${data.data.animalCodigo}` 
            : `Tropa: ${garronActual.tropaCodigo} (Sin identificar)`
        })
        setNumeroAnimal('')
        setAnimalEncontrado(null)
        fetchData()
      } else toast.error(data.error || 'Error al asignar')
    } catch { toast.error('Error de conexión') }
    finally { setSaving(false) }
  }

  // Asignar sin identificar (sin número de animal)
  const handleAsignarSinIdentificar = async () => {
    if (!garronActual) {
      toast.error('No hay garrón pendiente')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/garrones-asignados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          garron: garronActual.garron, 
          tropaCodigo: garronActual.tropaCodigo,
          listaFaenaId: listaFaenaId,
          sinIdentificar: true,
          operadorId: operador.id 
        })
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success(`Garrón #${garronActual.garron} asignado sin identificar`, { 
          description: `Tropa: ${garronActual.tropaCodigo}` 
        })
        setNumeroAnimal('')
        setAnimalEncontrado(null)
        fetchData()
      } else toast.error(data.error || 'Error al asignar')
    } catch { toast.error('Error de conexión') }
    finally { setSaving(false) }
  }

  const getAnimalesPendientes = () => totalPendientes

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
          modulo: 'ingresoCajon',
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
    return <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center"><BoxSelect className="w-8 h-8 animate-pulse text-amber-500" /></div>
  }

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

                <div className="space-y-2">
                  <Label className="text-xs">Label "Próximo Garrón"</Label>
                  <Input value={textos.labelProximoGarron} onChange={(e) => updateTexto('labelProximoGarron', e.target.value)} className="h-8" />
                </div>

                <Separator />
                <h4 className="font-medium text-sm text-stone-500">Labels del Resumen</h4>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Lista</Label>
                    <Input value={textos.labelLista} onChange={(e) => updateTexto('labelLista', e.target.value)} className="h-8" />
                  </div>
                  <div>
                    <Label className="text-xs">Asignados</Label>
                    <Input value={textos.labelAsignados} onChange={(e) => updateTexto('labelAsignados', e.target.value)} className="h-8" />
                  </div>
                  <div>
                    <Label className="text-xs">Pendientes</Label>
                    <Input value={textos.labelPendientes} onChange={(e) => updateTexto('labelPendientes', e.target.value)} className="h-8" />
                  </div>
                </div>

                <Separator />
                <h4 className="font-medium text-sm text-stone-500">Otros Textos</h4>
                
                <div className="space-y-2">
                  <Label className="text-xs">"Sin Identificar"</Label>
                  <Input value={textos.labelSinIdentificar} onChange={(e) => updateTexto('labelSinIdentificar', e.target.value)} className="h-8" />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">"Animal Encontrado"</Label>
                  <Input value={textos.labelAnimalEncontrado} onChange={(e) => updateTexto('labelAnimalEncontrado', e.target.value)} className="h-8" />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">"No hay garrones"</Label>
                  <Input value={textos.labelSinGarrones} onChange={(e) => updateTexto('labelSinGarrones', e.target.value)} className="h-8" />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Display vacío</Label>
                  <Input value={textos.textoDisplayVacio} onChange={(e) => updateTexto('textoDisplayVacio', e.target.value)} className="h-8" />
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
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={fetchData} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <RefreshCw className="w-4 h-4 mr-1" /> Actualizar
                </Button>
                <Badge variant="outline" className="text-lg px-4 py-2 bg-amber-500 border-amber-600 text-white">
                  {textos.labelProximoGarron}: <span className="font-bold ml-1">#{proximoGarron}</span>
                </Badge>
              </div>
            </div>
          </EditableBlock>
        )}

        {/* BLOQUE: Resumen */}
        {bloquesVisibles.find(b => b.id === 'resumen') && (
          <EditableBlock bloque={getBloque('resumen')!} editMode={editMode} onUpdate={updateBloque}>
            <div className="h-full bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center justify-around text-sm">
              <span className="flex items-center gap-2"><Hash className="w-4 h-4 text-blue-600" /><strong>{textos.labelLista}:</strong> {garrones.length}</span>
              <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /><strong>{textos.labelAsignados}:</strong> {totalAsignados}</span>
              <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" /><strong>{textos.labelPendientes}:</strong> {totalPendientes}</span>
            </div>
          </EditableBlock>
        )}

        {/* BLOQUE: Teclado */}
        {bloquesVisibles.find(b => b.id === 'teclado') && (
          <EditableBlock bloque={getBloque('teclado')!} editMode={editMode} onUpdate={updateBloque}>
            <Card className="h-full border-0 shadow-md overflow-hidden">
              <CardHeader className="bg-amber-50 py-2 px-4">
                <CardTitle className="text-sm">{getBloque('teclado')?.titulo || 'Ingreso de Número'}</CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-3 overflow-auto" style={{ height: 'calc(100% - 50px)' }}>
                {/* Mostrar garrón actual con tropa asignada */}
                {garronActual ? (
                  <div className="p-3 bg-amber-100 border-2 border-amber-300 rounded-lg text-center">
                    <div className="text-xs text-amber-600 mb-1">GARRÓN ACTUAL</div>
                    <div className="text-4xl font-bold text-amber-700">#{garronActual.garron}</div>
                    <div className="text-sm text-amber-800 mt-1">
                      Tropa: <strong>{garronActual.tropaCodigo}</strong>
                    </div>
                    <div className="text-xs text-amber-600">{garronActual.usuarioFaena}</div>
                  </div>
                ) : (
                  <div className="p-3 bg-green-100 border border-green-300 rounded-lg text-center">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-1" />
                    <div className="text-green-700 font-medium">Todos los garrones asignados</div>
                  </div>
                )}

                <div className="text-center p-3 bg-stone-900 rounded-lg">
                  <p className="text-stone-400 text-xs">{getBloque('teclado')?.placeholder || 'Número de Animal'}</p>
                  <div className="text-4xl font-mono font-bold text-amber-400">{numeroAnimal || textos.textoDisplayVacio}</div>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'backspace'].map((key) => (
                    <Button key={key} variant={key === 'clear' || key === 'backspace' ? 'destructive' : 'outline'} className="h-12 text-xl font-bold" onClick={() => handleKeyPress(key)} disabled={!garronActual}>
                      {key === 'clear' ? <Delete className="w-5 h-5" /> : key === 'backspace' ? '←' : key}
                    </Button>
                  ))}
                </div>

                {animalEncontrado ? (
                  <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-sm">
                    <div className="flex items-center gap-1 mb-1"><CheckCircle className="w-4 h-4 text-green-600" /><span className="font-medium text-green-700">{textos.labelAnimalEncontrado}</span></div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div><span className="text-stone-500">Código:</span> <b>{animalEncontrado.codigo}</b></div>
                      <div><span className="text-stone-500">Tropa:</span> {animalEncontrado.tropaCodigo}</div>
                      <div><span className="text-stone-500">Tipo:</span> {animalEncontrado.tipoAnimal}</div>
                      <div><span className="text-stone-500">Peso:</span> {animalEncontrado.pesoVivo?.toFixed(0) || '-'} kg</div>
                    </div>
                  </div>
                ) : numeroAnimal.length > 0 && (
                  <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">{textos.labelNoEncontrado || 'Animal no encontrado'}: {numeroAnimal}</div>
                )}

                <Separator />

                <div className="space-y-2">
                  {getBoton('asignar')?.visible && (
                    <Button onClick={() => handleAsignarGarron(animalEncontrado?.id || null)} disabled={saving || !garronActual || !animalEncontrado} className="w-full h-12 bg-green-600 hover:bg-green-700 text-base">
                      <Link2 className="w-5 h-5 mr-2" />{getBoton('asignar')?.texto} #{garronActual?.garron || proximoGarron}
                    </Button>
                  )}
                  {getBoton('sinIdentificar')?.visible && (
                    <Button onClick={handleAsignarSinIdentificar} disabled={saving || !garronActual} variant="outline" className="w-full h-10 border-orange-300 text-orange-600 hover:bg-orange-50">
                      {getBoton('sinIdentificar')?.texto}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </EditableBlock>
        )}

        {/* BLOQUE: Lista de Garrones */}
        {bloquesVisibles.find(b => b.id === 'listaGarrones') && (
          <EditableBlock bloque={getBloque('listaGarrones')!} editMode={editMode} onUpdate={updateBloque}>
            <Card className="h-full border-0 shadow-md overflow-hidden">
              <CardHeader className="bg-stone-50 py-2 px-4">
                <CardTitle className="text-sm">{getBloque('listaGarrones')?.titulo || 'Garrones'} ({garrones.filter(g => g.asignado).length}/{garrones.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-auto" style={{ height: 'calc(100% - 45px)' }}>
                {garrones.length === 0 ? (
                  <div className="p-6 text-center text-stone-400">
                    <BoxSelect className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{textos.labelSinGarrones}</p>
                  </div>
                ) : (
                  <div className="divide-y max-h-96 overflow-y-auto">
                    {garrones.map((g) => (
                      <div key={g.garron} className={cn("p-2 flex items-center justify-between", !g.asignado && g.garron === garronActual?.garron && "bg-amber-100 border-l-4 border-amber-500", g.asignado && "bg-green-50")}>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-amber-600 w-12">#{g.garron}</span>
                          {g.animalId ? (
                            <div><p className="font-medium text-sm">{g.animalCodigo}</p><p className="text-xs text-stone-500">{g.tropaCodigo} • {g.tipoAnimal}</p></div>
                          ) : (
                            <Badge variant="outline" className="text-orange-600 text-xs">{textos.labelSinIdentificar}</Badge>
                          )}
                        </div>
                        <div className="text-right">
                          {g.completado ? (
                            <Badge className="bg-green-100 text-green-700 text-xs"><Check className="w-3 h-3 mr-1" />OK</Badge>
                          ) : (
                            <span className="text-xs text-stone-500">{g.pesoVivo?.toFixed(0) || '-'} kg</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </EditableBlock>
        )}
      </div>
    </div>
  )
}

export default IngresoCajonModule
